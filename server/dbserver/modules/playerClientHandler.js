const WebSocket = require('ws');
const {ZodError} = require('zod');
const schemas = require('../middleware/validators');
const logger = require('../core/logger');
const {startCraft, finishCraft} = require('./crafting/craftHandler');
const {upgradeInventoryModule} = require('./upgrading/inventory/handler');
const {upgradeShipModule} = require('./upgrading/ship/handler');
const {dismantleModule} = require('./upgrading/dismantle/handler');
const {installShipModule} = require('./upgrading/ship/installHandler');
const {sendItem, getMails, claimItemFromMail, deleteMail} = require('./mailer/handler');
const {getInventory} = require('./inventory/inventory');
const {getPlayerExp} = require('./player/player');
const {getFactories, cancelCraftFactory} = require('./factory/factory');
const {
    getAllBlueprints, getAllResources, getAllComponents, getAllModules, getStagestoneTemplate, getAllHulls,
    getAllOther
} = require('../catalog/catalog');
const {getFullBuffCatalogForClient} = require('../catalog/buffs/catalog.js');
const {getActiveBuffs} = require('./buffs/buffsManager.js');
const {useItem} = require('./items/itemActionsManager.js');
const {handleGetLeaderboard} = require('./leaderboard/leaderboardManager');
const {safeSend} = require('../core/utils');
const {verifyFreshSession} = require('./session/session');
const {getReservationHistory} = require('./reservations/history');
const CONFIG = require("../core/config");

function validatePayload(ws, requestId, responseType, payload, schema) {
    try {
        return schema.parse(payload);
    } catch (error) {
        if (error instanceof ZodError) {
            const validationErrors = error.issues.map(e => `[${e.path.join('.') || 'object'}]: ${e.message}`).join('; ');
            logger.warn(`[Validator] Validation failed for '${responseType}'. Details: ${validationErrors}`);
            safeSend(ws, requestId, responseType, {
                success: false,
                error: 'Invalid input provided.'
            });
        } else {

            logger.warn(`[Validator] CRITICAL: Unexpected error during validation for '${responseType}':`, error);
            safeSend(ws, requestId, responseType, {
                success: false,
                error: 'Internal server validation error.'
            });
        }
        return null;
    }
}

/**
 * Обрабатывает все сообщения от идентифицированного игрового клиента.
 */
async function handlePlayerClientMessage(ws, clientInfo, type, payload, requestId, findExistingConnectionByWalletAddress, addPendingShipRequest) {

    try {

        switch (type) {
            case 'get-leaderboard': {
                const validatedPayload = validatePayload(ws, requestId, 'get-leaderboard-response', payload, schemas.getLeaderboardSchema);
                if (!validatedPayload) break;

                const result = await handleGetLeaderboard(validatedPayload, clientInfo.walletAddress);
                safeSend(ws, requestId, 'get-leaderboard-response', result);
                break;
            }
            case 'get-actual-exp': {
                const validatedPayloadGAE = validatePayload(ws, requestId, 'get-actual-exp-response', payload, schemas.emptyPayloadSchema);
                if (validatedPayloadGAE === null) break;

                const exp = await getPlayerExp(clientInfo.walletAddress);
                safeSend(ws, requestId, 'get-actual-exp-response', {success: exp !== null, exp: exp});
                break;
            }
            case 'get-active-buffs': {
                const validatedPayloadGAB = validatePayload(ws, requestId, 'get-active-buffs-response', payload, schemas.emptyPayloadSchema);
                if (validatedPayloadGAB === null) break;

                const result = await getActiveBuffs(clientInfo.walletAddress);
                safeSend(ws, requestId, 'get-active-buffs-response', result);
                break;
            }
            case 'mail-delete': {
                const validatedPayload = validatePayload(ws, requestId, 'mail-delete-response', payload, schemas.deleteMailSchema);
                if (!validatedPayload) break;

                const result = await deleteMail(validatedPayload, clientInfo.walletAddress);
                safeSend(ws, requestId, 'mail-delete-response', result);
                break;
            }
            case 'mail-claim-item': {
                const validatedPayload = validatePayload(ws, requestId, 'mail-claim-item-response', payload, schemas.claimItemFromMailSchema);
                if (!validatedPayload) break;

                const result = await claimItemFromMail(payload, clientInfo.walletAddress);
                safeSend(ws, requestId, 'mail-claim-item-response', result);
                break;
            }
            case 'mails-get-list': {
                const validatedPayload = validatePayload(ws, requestId, 'mails-get-list-response', payload, schemas.getMailsSchema);
                if (!validatedPayload) break;

                const result = await getMails(validatedPayload, clientInfo.walletAddress);
                safeSend(ws, requestId, 'mails-get-list-response', result);
                break;
            }
            case 'mail-send-item': {

                const sessionResult = await verifyFreshSession(clientInfo.sessionTokenHash);

                if (!sessionResult.success) {
                    safeSend(ws, requestId, 'error', {success: false, error: sessionResult.error});
                    break;
                }

                const validatedPayload = validatePayload(ws, requestId, 'mail-send-item-response', payload, schemas.sendItemSchema);
                if (!validatedPayload) break;

                validatedPayload.recipientAddress = validatedPayload.recipientAddress.toLowerCase();

                const result = await sendItem(validatedPayload, clientInfo.walletAddress);
                safeSend(ws, requestId, 'mail-send-item-response', result);

                if (result.success && result.inboxMail) {

                    const recipientConnection = findExistingConnectionByWalletAddress(validatedPayload.recipientAddress);
                    if (recipientConnection && recipientConnection.ws.readyState === WebSocket.OPEN) {
                        safeSend(recipientConnection.ws, null, 'new-mail', {mail: result.inboxMail});
                    }
                }
                break;
            }
            case 'use-item': {
                const validatedPayload = validatePayload(ws, requestId, 'use-item-response', payload, schemas.useItemSchema);
                if (!validatedPayload) break;

                const result = await useItem(validatedPayload, clientInfo.walletAddress);
                safeSend(ws, requestId, 'use-item-response', result);
                break;
            }
            case 'install-ship-module': {
                const validatedPayload = validatePayload(ws, requestId, 'install-ship-module-response', payload, schemas.installShipModuleSchema);
                if (!validatedPayload) break;

                const result = await installShipModule(validatedPayload, clientInfo.walletAddress);
                safeSend(ws, requestId, 'install-ship-module-response', result);
                break;
            }
            case 'dismantle-module': {
                const validatedPayload = validatePayload(ws, requestId, 'dismantle-module-response', payload, schemas.dismantleModuleSchema);
                if (!validatedPayload) break;

                const result = await dismantleModule(validatedPayload, clientInfo.walletAddress);
                safeSend(ws, requestId, 'dismantle-module-response', result);
                break;
            }
            case 'upgrade-module': {
                const validatedPayload = validatePayload(ws, requestId, 'upgrade-module-response', payload, schemas.upgradeInventoryModuleSchema);
                if (!validatedPayload) break;

                const result = await upgradeInventoryModule(validatedPayload, clientInfo.walletAddress);
                safeSend(ws, requestId, 'upgrade-module-response', result);
                break;
            }
            case 'upgrade-ship-module': {
                const validatedPayload = validatePayload(ws, requestId, 'upgrade-ship-module-response', payload, schemas.upgradeShipModuleSchema);
                if (!validatedPayload) break;

                const result = await upgradeShipModule(validatedPayload, clientInfo.walletAddress);
                safeSend(ws, requestId, 'upgrade-ship-module-response', result);
                break;
            }
            case 'start-craft': {
                const validatedPayload = validatePayload(ws, requestId, 'start-craft-response', payload, schemas.startCraftSchema);
                if (!validatedPayload) break;

                const result = await startCraft(validatedPayload, clientInfo.walletAddress);
                safeSend(ws, requestId, 'start-craft-response', result);
                break;
            }
            case 'finish-craft': {
                const validatedPayload = validatePayload(ws, requestId, 'finish-craft-response', payload, schemas.finishCraftSchema);
                if (!validatedPayload) break;

                const result = await finishCraft(validatedPayload, clientInfo.walletAddress);
                safeSend(ws, requestId, 'finish-craft-response', result);
                break;
            }
            case 'cancel-craft': {
                const validatedPayload = validatePayload(ws, requestId, 'cancel-craft-response', payload, schemas.cancelCraftSchema);
                if (!validatedPayload) break;

                const result = await cancelCraftFactory(validatedPayload, clientInfo.walletAddress);
                safeSend(ws, requestId, 'cancel-craft-response', result);
                break;
            }
            case 'get-catalog':
                const validatedPayloadGC = validatePayload(ws, requestId, 'get-catalog-response', payload, schemas.emptyPayloadSchema);
                if (validatedPayloadGC === null) break;

                safeSend(ws, requestId, 'get-catalog-response', {
                    success: true,
                    blueprints: getAllBlueprints(),
                    resources: getAllResources(),
                    components: getAllComponents(),
                    modules: getAllModules(),
                    hulls: getAllHulls(),
                    other: getAllOther(),
                    stagestone_template: getStagestoneTemplate(),
                    buffs: getFullBuffCatalogForClient()
                });
                break;
            case 'get-inventory':
                const validatedPayloadGI = validatePayload(ws, requestId, 'get-inventory-response', payload, schemas.emptyPayloadSchema);
                if (validatedPayloadGI === null) break;

                const inv = await getInventory(clientInfo.walletAddress);
                safeSend(ws, requestId, 'get-inventory-response', inv);
                break;
            case 'get-factories':
                const validatedPayloadGF = validatePayload(ws, requestId, 'get-factories-response', payload, schemas.emptyPayloadSchema);
                if (validatedPayloadGF === null) break;

                const factories = await getFactories(clientInfo.walletAddress);
                safeSend(ws, requestId, 'get-factories-response', factories);
                break;
            case 'get-transaction-history': {

                const validatedPayload = validatePayload(ws, requestId, 'get-transaction-history-response', payload, schemas.getTransactionHistorySchema
                );

                if (!validatedPayload) break;

                const historyCategory = validatedPayload.category;
                const limit = validatedPayload.limit || 50;
                const offset = validatedPayload.offset || 0;

                const historyResult = await getReservationHistory(clientInfo.walletAddress, historyCategory, limit, offset
                );

                safeSend(ws, requestId, 'get-transaction-history-response', historyResult);
                break;
            }
            case 'get-ships':
                const validatedPayloadGS = validatePayload(ws, requestId, 'get-ships-response', payload, schemas.emptyPayloadSchema);
                if (validatedPayloadGS === null) break;

                addPendingShipRequest(ws, requestId, clientInfo.walletAddress);
                break;

            default:
                logger.warn(`Unauthorized message type for client: ${type}, requestId: ${requestId}`);
                clientInfo.unknownMessageCount = (clientInfo.unknownMessageCount || 0) + 1;
                const maxUnknown = CONFIG.security.MAX_UNKNOWN_MESSAGES_BEFORE_CLOSE || 1;
                if (clientInfo.unknownMessageCount >= maxUnknown) {
                    logger.warn(`Closing connection for ${clientInfo.clientType} (${clientInfo.clientId}) due to excessive unknown messages`);
                    ws.close(1008, 'Too many unknown messages');
                }
                return;
        }
    } catch (error) {
        logger.error(`[PlayerClientHandler] CRITICAL Error processing '${type}' for ${clientInfo.walletAddress}: ${error.message}`);
        safeSend(ws, requestId, 'error', {message: 'An internal server error occurred.'});
    }
}

module.exports = {handlePlayerClientMessage};
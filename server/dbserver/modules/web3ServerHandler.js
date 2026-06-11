const {Ship, createShip, getPlayerShips} = require('./ships/ships');
const WebSocket = require("ws");
const {
    reserveResourcesForShipCraft,
    reserveResourcesForTokenClaim,
    finalizeReservation
} = require('./reservations/logic');
const {safeSend} = require('../core/utils');
const logger = require("../core/logger");

async function handleWeb3ServerMessage(ws, type, payload, requestId, pendingShipRequests) {
    try {
        switch (type) {
            case 'ships-minted-history':
                const {ships} = payload;
                for (const {tokenId, shipTypeId} of ships) {
                    const existingShip = await Ship.findOne({shipId: tokenId}).lean();
                    if (!existingShip) {
                        await createShip(tokenId, shipTypeId);
                    }
                }
                break;

            case 'fetch-ships-by-address-response':
                const {success, owner, error} = payload;
                const pendingRequest = pendingShipRequests.get(requestId);
                if (!pendingRequest) {
                    logger.warn(`[WEB3SERVERHANDLER]: No pending request found for fetch-ships-by-address-response with requestId: ${requestId}`);
                    break;
                }

                const {ws: clientWs, clientRequestId} = pendingRequest;
                pendingShipRequests.delete(requestId);

                if (!clientWs || clientWs.readyState !== WebSocket.OPEN) {
                    logger.warn('[WEB3SERVERHANDLER]: Client WebSocket is closed or unavailable');
                    break;
                }

                if (success) {
                    const {tokens, shipTypes} = payload;
                    if (!tokens || tokens.length === 0) {
                        safeSend(clientWs, clientRequestId, 'get-ships-response', {success: true, allPlayerShips: []});
                    } else {

                        const combinedShipsInfo = tokens.map((id, index) => ({
                            tokenId: Number(id),
                            shipTypeId: Number(shipTypes[index])
                        }));
                        const tokenIds = combinedShipsInfo.map(s => s.tokenId);
                        const existingShips = await Ship.find({shipId: {$in: tokenIds}}).select('shipId').lean();
                        const existingShipIds = new Set(existingShips.map(s => s.shipId));
                        const newShipsToCreate = combinedShipsInfo.filter(s => !existingShipIds.has(s.tokenId));

                        if (newShipsToCreate.length > 0) {
                            logger.debug(`Обнаружено ${newShipsToCreate.length} новых кораблей для владельца ${owner}. Создание...`);
                            await Promise.all(newShipsToCreate.map(shipInfo =>
                                createShip(shipInfo.tokenId, shipInfo.shipTypeId)
                            ));
                        }

                        const allPlayerShips = await getPlayerShips(tokenIds);
                        safeSend(clientWs, clientRequestId, 'get-ships-response', {success: true, allPlayerShips});
                    }

                    logger.debug(`Sent get-ships-response to client for walletAddress: ${owner}, tokens: ${tokens}`);
                } else {
                    safeSend(clientWs, 'get-ships-response', clientRequestId, {
                        success: false,
                        error: payload.error || 'Failed to fetch ships'
                    });
                    logger.error(`[WEB3SERVERHANDLER - fetch-ships-by-address-response]: Failed to fetch ships tokens. ${error}`);
                }
                break;
            case 'reserve-resources-for-ship-craft': {
                const {walletAddress, shipTypeId} = payload;
                if (!walletAddress || shipTypeId === undefined) {
                    safeSend(ws, requestId, 'reserve-resources-for-ship-craft-response', {
                        success: false,
                        error: 'Invalid payload for reservation'
                    });
                    break;
                }

                const reservationResult = await reserveResourcesForShipCraft(walletAddress, shipTypeId);

                safeSend(ws, requestId, 'reserve-resources-for-ship-craft-response', reservationResult);
                break;
            }

            case 'reserve-resources-for-token-claim': {

                const {walletAddress, coinsAmount, epoch} = payload;

                if (!walletAddress || !coinsAmount) {
                    safeSend(ws, requestId, 'reserve-resources-for-token-claim-response', {
                        success: false,
                        error: 'Invalid payload for token reservation'
                    });
                    break;
                }

                const reservationResult = await reserveResourcesForTokenClaim(walletAddress, Number(coinsAmount), epoch);

                safeSend(ws, requestId, 'reserve-resources-for-token-claim-response', reservationResult);
                break;
            }

            case 'finalize-craft-reservation':
            case 'finalize-token-claim': {

                const reservationId = payload.craftId || payload.claimId;
                const {txHash} = payload;

                if (!reservationId) {
                    logger.warn(`[WEB3SERVERHANDLER] Finalization requested without ID for ${type}`);
                    break;
                }

                const result = await finalizeReservation(reservationId, txHash);

                if (result.success) {
                    logger.debug(`[WEB3SERVERHANDLER - ${type}]: dbServer подтвердил успешную финализацию для ${reservationId}.`);
                } else {

                    logger.warn(`[WEB3SERVERHANDLER - ${type}] Warning: Финализация для ${reservationId}: ${result.message || result.error}`);
                }
                break;
            }

            default:

                logger.error(`[WEB3SERVERHANDLER] [SERVER BUG] Received unknown message type: ${type}`);
                break;
        }
    } catch (error) {
        logger.error(`[WEB3SERVERHANDLER] Critical error processing '${type}': ${error.message}`);
        safeSend(ws, requestId, 'error', {reason: `Critical error on dbserver while processing ${type}`});
    }

    return true;
}

module.exports = {handleWeb3ServerMessage};
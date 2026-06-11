const path = require('path');
require('dotenv').config({path: path.resolve(__dirname, '../../.env')});
const mongoose = require('mongoose');
const axios = require('axios');
const CONFIG = require('../../core/config');
const logger = require('../../core/logger');
const {logCraftAttempt} = require('../../core/auditLogger');

const Reservation = require('./schema');
const Mail = require('../mailer/mail');
const redis = require('../../core/redisClient');
const {initializeSecrets, getSecret, decryptSecret} = require("../../core/secrets");
const healthMonitor = require('../../core/healthMonitor');
const {getItemData, loadCatalog} = require('../../catalog/catalog');

const CLEANUP_INTERVAL_MS = 1 * 60 * 1000;

async function processExpiredReservations() {
    logger.debug('[Reconciler] Запуск сверки истекших резерваций...');
    const now = new Date();

    const candidates = await Reservation.find({
        status: 'RESERVED',
        expiresAt: {$lt: now}
    }).lean();

    if (candidates.length === 0) {
        logger.debug('[Reconciler] Не найдено истекших резерваций для сверки.');
        return;
    }

    logger.info(`[Reconciler] Найдено ${candidates.length} кандидатов для финальной сверки с блокчейном.`);

    for (const reservation of candidates) {
        const walletAddress = reservation.walletAddress?.toLowerCase();

        const reservationId = reservation.reservationId;
        const type = reservation.type;

        let blockchainStatus;

        try {

            let checkUrl;
            if (type === 'SHIP_CRAFT') {
                checkUrl = `${CONFIG.server.WEB3_SERVER_URL}/internal/api/v1/get-craft-status/${reservationId}`;
            } else if (type === 'TOKEN_CLAIM') {
                checkUrl = `${CONFIG.server.WEB3_SERVER_URL}/internal/api/v1/get-claim-status/${reservationId}`;
            } else {
                logger.warn(`[Reconciler] Неизвестный тип резервации: ${type} (ID: ${reservationId}). Пропуск.`);
                continue;
            }

            const response = await axios.get(checkUrl, {timeout: 15000});
            blockchainStatus = response.data;

        } catch (error) {

            logger.error(`[Reconciler] Ошибка связи с web3server для ${reservationId} (${type}): ${error.message}.`);
            continue;
        }

        if (blockchainStatus.status === 'FINALIZED') {
            logger.warn(`[Reconciler] Обнаружен пропущенный успех (${type}) для ${reservationId}. Финализация в БД.`);

            await Reservation.updateOne(
                {_id: reservation._id, status: 'RESERVED'},
                {$set: {status: 'FINALIZED', transactionHash: blockchainStatus.transactionHash}}
            );

            if (redis.redisClient && redis.redisClient.isOpen) {
                await redis.redisClient.publish('tx-history-events', JSON.stringify({
                    event: 'tx-history_updated',
                    walletAddress: walletAddress
                }));
                logger.debug(`[Reconciler] Sent tx-history update (FINALIZED) for ${walletAddress}`);
            }

            const logDetails = {
                transactionHash: blockchainStatus.transactionHash,
                reason: "Finalized by reconciler"
            };

            if (reservation.shipTypeId !== undefined) logDetails.shipTypeId = reservation.shipTypeId;
            if (reservation.tokenAmount !== undefined) logDetails.tokenAmount = reservation.tokenAmount;

            logCraftAttempt('FINALIZATION_SUCCESS', {
                walletAddress: walletAddress,
                type: type,
                reservationId: reservationId,
                details: logDetails
            });

        } else if (blockchainStatus.status === 'NOT_FOUND') {
            logger.info(`[Reconciler] Транзакция для ${reservationId} (${type}) не найдена. Возврат ресурсов.`);

            const session = await mongoose.startSession();
            try {
                await session.withTransaction(async () => {

                    for (const [itemKey, itemData] of Object.entries(reservation.items)) {

                        const catalogItem = getItemData(itemKey);
                        const itemName = catalogItem ? catalogItem.name : itemKey;

                        const singleAttachment = [{
                            itemKey: itemKey,
                            category: itemData.category,
                            data: {
                                quantity: itemData.quantity
                            }
                        }];

                        const expirationDate = new Date();
                        expirationDate.setDate(expirationDate.getDate() + 30);

                        const subjectPrefix = 'Refunded';

                        const returnMail = new Mail({
                            ownerAddress: walletAddress,
                            folder: 'inbox',
                            senderAddress: '0x0000000000000000000000000000000000000000',
                            recipientAddress: walletAddress,
                            subject: `${subjectPrefix}: ${itemName} x${itemData.quantity}`,
                            body: `Automatic refund for expired reservation (${type}). Resources returned: ${itemName} x${itemData.quantity}.`,
                            attachments: singleAttachment,
                            hasAttachments: true,
                            expiresAt: expirationDate
                        });

                        await returnMail.save({session});

                        const mailObject = returnMail.toObject();
                        mailObject._id = mailObject._id.toString();

                        if (redis.redisClient && redis.redisClient.isOpen) {
                            await redis.redisClient.publish('system-mail-events', JSON.stringify({
                                event: 'new_system_mail',
                                walletAddress: walletAddress,
                                mail: mailObject
                            }));
                        }
                    }

                    await Reservation.updateOne(
                        {_id: reservation._id, status: 'RESERVED'},
                        {$set: {status: 'REFUNDED'}},
                        {session}
                    );
                });

                if (redis.redisClient && redis.redisClient.isOpen) {
                    await redis.redisClient.publish('tx-history-events', JSON.stringify({
                        event: 'tx-history_updated',
                        walletAddress: walletAddress
                    }));
                    logger.debug(`[Reconciler] Sent tx-history update (REFUNDED) for ${walletAddress}`);
                }

                logger.info(`[Reconciler] Возврат ресурсов для ${reservationId} выполнен.`);

                logCraftAttempt('RESOURCES_RETURNED', {
                    walletAddress: walletAddress,
                    type: type,
                    reservationId: reservationId,
                    details: {
                        items: reservation.items,
                        reason: "Reservation expired and returned via mail"
                    }
                });

            } catch (txError) {
                logger.error(`[Reconciler] Ошибка транзакции при возврате (${reservationId}): ${txError.message}`);
            } finally {
                await session.endSession();
            }
        }
    }
}

async function runCleanupCycle() {
    await healthMonitor.pulse();
    try {
        await processExpiredReservations();
    } catch (e) {
        logger.error(`[Reconciler] Необработанная ошибка в цикле очистки: ${e.message}`);
    } finally {
        setTimeout(runCleanupCycle, CLEANUP_INTERVAL_MS);
    }
}

async function initialize() {
    logger.info('[Reconciler] Запуск воркера для сверки резерваций (Unified)...');
    try {
        await initializeSecrets();

        const encryptedMongoCred = getSecret(CONFIG.security.infisical.secrets.ENCRYPTED_DB_CRED);
        if (!encryptedMongoCred) {
            throw new Error(`Учетные данные для БД не найдены.`);
        }

        let mongoCred = await decryptSecret(encryptedMongoCred);
        const connectionString = CONFIG.database.MONGO_URI_START + mongoCred + CONFIG.database.MONGO_URI_END;
        mongoCred = null;

        await mongoose.connect(connectionString);
        await redis.connectRedis();
        loadCatalog();
        healthMonitor.start('reconciler', 'main', true);
        logger.info('[Reconciler] Успешное подключение к MongoDB и Redis.');

        runCleanupCycle();
    } catch (err) {
        logger.error('[Reconciler] КРИТИЧЕСКАЯ ОШИБКА при инициализации:', err.message);
        process.exit(1);
    }
}

initialize();
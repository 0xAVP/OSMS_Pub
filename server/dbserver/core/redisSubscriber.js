const {createClient} = require('redis');
const CONFIG = require('./config');
const {Buff} = require('../modules/buffs/buffs');
const logger = require('./logger');
const {clients} = require('../modules/handler');
const {safeSend} = require('./utils');
const {getSecret, decryptSecret} = require('./secrets');

let subscriber;

async function connectAndSubscribe() {
    if (subscriber && subscriber.isOpen) {
        logger.info('dbServer: Already connected and subscribed to Redis channels.');
        return;
    }

    const encryptedPassword = getSecret(CONFIG.security.infisical.secrets.ENCRYPTED_REDIS_PASSWORD);
    if (!encryptedPassword) {
        throw new Error('Пароль для Redis не найден в Infisical. Сервер не может запуститься.');
    }

    let password = await decryptSecret(encryptedPassword);

    try {
        subscriber = createClient({
            url: CONFIG.database.REDIS_URI,
            password: password
        });

        password = null;

        subscriber.on('error', (err) => logger.error('dbServer Redis Subscriber Error:', err));

        await subscriber.connect();

        await subscriber.subscribe('system-mail-events', (message) => {
            try {
                const data = JSON.parse(message);

                if (data.event === 'new_system_mail') {
                    const {walletAddress: rawWallet, mail} = data;
                    const walletAddress = rawWallet?.toLowerCase();
                    if (!walletAddress || !mail) {
                        logger.error(`Invalid 'new_system_mail' message: ${message}`, 'redis_subscriber');
                        return;
                    }

                    const clientWs = findClientByWallet(walletAddress);
                    if (clientWs) {

                        safeSend(clientWs, null, 'new-mail', {mail});
                        logger.debug(`Отправлено уведомление 'new-mail' игроку ${walletAddress} через Redis.`, 'mail-events');
                    }
                }
            } catch (e) {
                logger.error(`Error parsing Redis mail-event message: ${e.message}`, 'redis_subscriber');
            }
        });
        console.log("dbServer: Subscribed to 'mail-events' channel in Redis.");

        await subscriber.subscribe('buff-events', (message) => {
            try {
                const data = JSON.parse(message);

                if (data.event === 'consume_portal_buff') {
                    const {walletAddress: rawWallet, buffId} = data;
                    const walletAddress = rawWallet?.toLowerCase();
                    if (!walletAddress || !buffId) {
                        logger.error(`Invalid 'consume_portal_buff' message: ${message}`, 'redis_subscriber');
                        return;
                    }

                    Buff.deleteOne({walletAddress, buffId})
                        .then(result => {
                            if (result.deletedCount > 0) {
                                logger.debug(`Successfully consumed buff '${buffId}' for ${walletAddress}.`, 'buffs');
                            } else {
                                logger.error(`Attempted to consume buff '${buffId}' for ${walletAddress}, but it was not found.`, 'buffs');
                            }
                        })
                        .catch(err => {
                            logger.error(`DB error while consuming buff '${buffId}' for ${walletAddress}: ${err.message}`, 'buffs');
                        });
                }

            } catch (e) {
                logger.error(`Error parsing Redis message: ${e.message}`, 'redis_subscriber');
            }
        });
        console.log("dbServer: Subscribed to 'buff-events' channel in Redis.");

        await subscriber.subscribe('tx-history-events', (message) => {
            try {
                const data = JSON.parse(message);
                if (data.event === 'tx-history_updated') {
                    const {walletAddress} = data;
                    if (!walletAddress) return;

                    const clientWs = findClientByWallet(walletAddress);
                    if (clientWs) {

                        safeSend(clientWs, null, 'tx-history-updated', {});
                        logger.debug(`Sent 'tx-history-updated' to ${walletAddress}`, 'redis_subscriber');
                    }
                }
            } catch (e) {
                logger.error(`Error parsing tx-history-events message: ${e.message}`, 'redis_subscriber');
            }
        });
        console.log("dbServer: Subscribed to 'tx-history-events' channel.");

    } catch (err) {

        password = null;
        logger.error(`dbServer: FATAL - Could not connect or subscribe to Redis. Error:`, err);
        throw err;
    }
}

function findClientByWallet(walletAddress) {
    for (const [ws, clientInfo] of clients.entries()) {
        if (clientInfo.walletAddress && clientInfo.walletAddress.toLowerCase() === walletAddress.toLowerCase()) {
            return ws;
        }
    }
    return null;
}

module.exports = {
    connectAndSubscribe,
    get redisSubscriber() {
        if (!subscriber) {
            throw new Error('Попытка доступа к redisSubscriber до его инициализации. Убедитесь, что connectAndSubscribe() был вызван.');
        }
        return subscriber;
    }
};
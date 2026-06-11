const {createClient} = require('redis');
const {gameSessions} = require('../session/sessions');
const {terminateSession} = require('../session/sessionTerminator');
const CONFIG = require('../../core/config');
const logger = require('../../core/logger');
const {getSecret, decryptSecret} = require('../../core/secrets');

let redisSubscriber;

async function connectAndSubscribeRedis() {
    if (redisSubscriber && redisSubscriber.isOpen) {
        logger.warn(`[REDISSUBSCRIBER] Worker ${process.pid}: Already connected to Redis.`);
        return;
    }

    const encryptedPassword = getSecret(CONFIG.security.infisical.secrets.ENCRYPTED_REDIS_PASSWORD);
    if (!encryptedPassword) {
        throw new Error('Зашифрованный пароль для Redis не найден в Infisical. Воркер не может запуститься.');
    }

    let password = await decryptSecret(encryptedPassword);

    try {
        redisSubscriber = createClient({
            url: CONFIG.connections.REDIS_URI,
            password: password
        });

        password = null;

        redisSubscriber.on('error', (err) => logger.error(`[REDISSUBSCRIBER] Worker ${process.pid}: Redis Subscriber Error`, err));

        await redisSubscriber.connect();

        await redisSubscriber.subscribe('session-events', (message) => {
            try {
                const data = JSON.parse(message);

                if (data.event === 'new_hangar_session') {
                    const walletAddress = data.walletAddress?.toLowerCase();
                    let sessionToTerminate = null;

                    for (const session of gameSessions.values()) {
                        if (session.player === walletAddress) {
                            sessionToTerminate = session;
                            break;
                        }
                    }

                    if (sessionToTerminate) {
                        console.log(`[REDISSUBSCRIBER] Worker ${process.pid}: Found active game session for ${walletAddress}. Terminating...`);

                        terminateSession(sessionToTerminate, 'session_terminated_by_new_connection');
                    }

                }
            } catch (e) {
                logger.error(`[REDISSUBSCRIBER] Worker ${process.pid}: Error parsing Redis message:`, e);
            }
        });

        await redisSubscriber.subscribe('session_control_events', (message) => {
            try {
                const data = JSON.parse(message);

                if (data.action === 'terminate') {
                    const walletAddress = data.walletAddress?.toLowerCase();

                    const {reason} = data;

                    let sessionToTerminate = null;

                    for (const session of gameSessions.values()) {
                        if (session.player === walletAddress) {
                            sessionToTerminate = session;
                            break;
                        }
                    }

                    if (sessionToTerminate) {
                        logger.info(`[REDISSUBSCRIBER] Worker ${process.pid}: Terminating session for ${walletAddress} by remote command. Reason: ${reason}`);
                        terminateSession(sessionToTerminate, reason);
                    }
                }
            } catch (e) {
                logger.error(`[REDISSUBSCRIBER] Worker ${process.pid}: Error parsing control message:`, e);
            }
        });

        logger.info(`[REDISSUBSCRIBER] Worker ${process.pid}: Subscribed to 'session-events' and 'session_control_events' channels.`);

    } catch (err) {
        password = null;
        logger.error(`[REDISSUBSCRIBER] Worker ${process.pid}: FATAL - Could not connect or subscribe to Redis. Error:`, err);
        throw err;
    }
}

module.exports = {
    connectAndSubscribeRedis,
    get redisSubscriberClient() {
        return redisSubscriber;
    }
};
const {createClient} = require('redis');
const logger = require('../../core/logger');
const CONFIG = require('../../core/config');

const {getSecret, decryptSecret} = require('../../core/secrets');

let redisClient;

async function connectRedis() {
    if (redisClient && redisClient.isOpen) {
        return;
    }

    const encryptedPassword = getSecret(CONFIG.security.infisical.secrets.ENCRYPTED_REDIS_PASSWORD);
    if (!encryptedPassword) {
        throw new Error('Зашифрованный пароль для Redis не найден в Infisical. Воркер не может запуститься.');
    }

    let password = await decryptSecret(encryptedPassword);

    try {
        redisClient = createClient({
            url: CONFIG.connections.REDIS_URI,
            password: password
        });

        password = null;

        redisClient.on('error', (err) => logger.error(`[REDISCLIENT] Worker ${process.pid}: Redis Client Error`, err));

        await redisClient.connect();
        logger.info(`[REDISCLIENT] Worker ${process.pid}: Successfully connected to Redis.`);

    } catch (err) {

        password = null;
        logger.error(`[REDISCLIENT] Worker ${process.pid}: Could not connect to Redis.`, err);
        throw err;
    }
}

module.exports = {
    connectRedis,
    get redisClient() {
        if (!redisClient) {
            throw new Error(`Попытка доступа к redisClient до его инициализации. Убедитесь, что connectRedis() был вызван в worker.`);
        }
        return redisClient;
    }
};
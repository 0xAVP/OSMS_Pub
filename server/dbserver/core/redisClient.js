const {createClient} = require('redis');
const CONFIG = require('./config');
const logger = require('./logger');

const {getSecret, decryptSecret} = require('./secrets');

let redisClient;

async function connectRedis() {
    if (redisClient && redisClient.isOpen) {
        return;
    }

    const encryptedPassword = getSecret(CONFIG.security.infisical.secrets.ENCRYPTED_REDIS_PASSWORD);
    if (!encryptedPassword) {
        throw new Error('Пароль для Redis не найден в Infisical. Сервер не может запуститься.');
    }

    let password = await decryptSecret(encryptedPassword);

    try {
        redisClient = createClient({
            url: CONFIG.database.REDIS_URI,
            password: password
        });

        password = null;

        redisClient.on('error', (err) => logger.error('dbServer: Redis Client Error', err));

        await redisClient.connect();
        logger.info('dbServer: Successfully connected to Redis (main client).');

    } catch (err) {

        password = null;
        logger.error('dbServer: Could not connect to Redis.', err);
        throw err;
    }
}

module.exports = {
    connectRedis,
    get redisClient() {
        if (!redisClient) {
            throw new Error('Попытка доступа к redisClient до его инициализации. Убедитесь, что connectRedis() был вызван.');
        }
        return redisClient;
    }
};
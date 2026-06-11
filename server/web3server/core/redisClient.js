const {createClient} = require('redis');
const CONFIG = require('./config');
const logger = require('../core/logger');

const {getSecret, decryptSecret} = require('./secrets');

let redisClient;

async function connectRedis() {
    if (redisClient && redisClient.isOpen) {
        return;
    }

    const secretName = CONFIG.security.infisical.secrets.ENCRYPTED_REDIS_PASSWORD;
    const encryptedPassword = getSecret(secretName);
    if (!encryptedPassword) {
        throw new Error(`Пароль для Redis ('${secretName}') не найден в Infisical. Сервер не может запуститься.`);
    }

    let password = await decryptSecret(encryptedPassword);

    try {
        redisClient = createClient({
            url: CONFIG.connections.redis.REDIS_URI,
            password: password,
        });

        password = null;

        redisClient.on('error', (err) => logger.error('Web3Server: Redis Client Error', err));

        await redisClient.connect();
        logger.info('Web3Server: Successfully connected to Redis.');
    } catch (err) {

        password = null;
        logger.error('Web3Server: Could not connect to Redis.', err);
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
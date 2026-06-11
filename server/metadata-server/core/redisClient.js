const {createClient} = require('redis');
const CONFIG = require('./config');
const logger = require('./logger');

const {getSecret, decryptSecret} = require('./secrets');

let redisClient;
let redisSubscriber;

/**
 * Создает, настраивает и подключает оба клиента Redis с использованием пароля.
 */
async function connectRedis() {
    if (redisClient && redisClient.isOpen) {
        return;
    }

    const secretName = CONFIG.security.infisical.secrets.ENCRYPTED_REDIS_PASSWORD;
    const encryptedPassword = getSecret(secretName);
    if (!encryptedPassword) {
        throw new Error(`Пароль для Redis ('${secretName}') не найден в Infisical.`);
    }

    let password = await decryptSecret(encryptedPassword);

    try {
        redisClient = createClient({
            url: CONFIG.connections.REDIS_URI,
            password: password,
        });

        redisSubscriber = redisClient.duplicate();

        password = null;

        redisClient.on('error', (err) => logger.error('[MetadataServer-Redis] Client Error', err));
        redisSubscriber.on('error', (err) => logger.error('[MetadataServer-Redis] Subscriber Error', err));

        await Promise.all([
            redisClient.connect(),
            redisSubscriber.connect()
        ]);
        logger.info('[MetadataServer] Успешно подключено 2 клиента к Redis (основной и подписчик).');

    } catch (err) {
        password = null;
        logger.error('[MetadataServer] Не удалось подключиться к Redis.', err);
        throw err;
    }
}

module.exports = {
    connectRedis,
    get redisClient() {
        if (!redisClient) {
            throw new Error('Попытка доступа к redisClient до его инициализации.');
        }
        return redisClient;
    },
    get redisSubscriber() {
        if (!redisSubscriber) {
            throw new Error('Попытка доступа к redisSubscriber до его инициализации.');
        }
        return redisSubscriber;
    }
};
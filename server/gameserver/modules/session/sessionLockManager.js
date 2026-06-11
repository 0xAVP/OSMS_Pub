const redis = require('../db/redisClient');
const logger = require('../../core/logger');

const LOCK_TTL_SECONDS = 10;
const LOCK_PREFIX = 'lock:session:creation:';

/**
 * Генерирует уникальный ключ для блокировки в Redis.
 * @param {string} walletAddress - Адрес кошелька игрока.
 * @returns {string}
 */
function getLockKey(walletAddress) {
    return `${LOCK_PREFIX}${walletAddress?.toLowerCase()}`;
}

/**
 * Пытается атомарно установить блокировку для указанного кошелька.
 * @param {string} walletAddress - Адрес кошелька.
 * @returns {Promise<boolean>} - true, если блокировка успешно установлена, иначе false.
 */
async function acquireLock(walletAddress) {
    const lockKey = getLockKey(walletAddress);
    try {
        const result = await redis.redisClient.set(lockKey, `worker:${process.pid}`, {
            EX: LOCK_TTL_SECONDS,
            NX: true
        });

        return result === 'OK';
    } catch (error) {
        logger.error(`[SessionLockManager] Критическая ошибка при попытке установить блокировку для ${walletAddress}: ${error.message}`);

        return false;
    }
}

/**
 * Снимает блокировку для указанного кошелька.
 * @param {string} walletAddress - Адрес кошелька.
 */
async function releaseLock(walletAddress) {
    const lockKey = getLockKey(walletAddress);
    try {
        await redis.redisClient.del(lockKey);
    } catch (error) {
        logger.error(`[SessionLockManager] Ошибка при снятии блокировки для ${walletAddress}: ${error.message}`);
    }
}

module.exports = {acquireLock, releaseLock};
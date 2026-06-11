const {RateLimiterMemory} = require('rate-limiter-flexible');
const ip = require('ip');
const CONFIG = require('../core/config');

const unknownLimiter = new RateLimiterMemory({
    points: CONFIG.rateLimits.limits.unknown.maxMessages,
    duration: CONFIG.rateLimits.limits.unknown.windowMs / 1000,
});

const clientLimiter = new RateLimiterMemory({
    points: CONFIG.rateLimits.limits.client.maxMessages,
    duration: CONFIG.rateLimits.limits.client.windowMs / 1000,
});

const craftLimiter = new RateLimiterMemory({
    points: CONFIG.rateLimits.limits.startCraft.maxMessages,
    duration: CONFIG.rateLimits.limits.startCraft.windowMs / 1000,
});

const upgradeLimiter = new RateLimiterMemory({
    points: CONFIG.rateLimits.limits.moduleUpgrade.maxMessages,
    duration: CONFIG.rateLimits.limits.moduleUpgrade.windowMs / 1000,
});

/**
 * Проверяет лимит запросов для ключа.
 * @param {string} key - Ключ для проверки (IP-адрес или walletAddress).
 * @param {string} type - Тип лимита ('unknown', 'client', 'startCraft', 'moduleUpgrade').
 * @returns {Promise<boolean>} - true, если лимит не превышен, false - если превышен.
 */
async function checkRateLimit(key, type) {
    let limiter;

    switch (type) {
        case 'client':
            limiter = clientLimiter;
            break;
        case 'startCraft':
            limiter = craftLimiter;
            break;
        case 'moduleUpgrade':
            limiter = upgradeLimiter;
            break;
        default:
            limiter = unknownLimiter;
            break;
    }

    try {

        await limiter.consume(key);
        return true;
    } catch (error) {

        return false;
    }
}

/**
 * Проверяет, находится ли IP-адрес в белом списке.
 * Поддерживает как точные IP, так и CIDR-диапазоны (например, '192.168.1.0/24').
 * @param {string} clientIp - IP-адрес клиента для проверки.
 * @returns {boolean} - true, если IP в белом списке.
 */
function isIpWhitelisted(clientIp) {
    if (!ip.isV4Format(clientIp) && !ip.isV6Format(clientIp)) {
        return false;
    }

    for (const entry of CONFIG.security.SERVER_WHITELISTED_IPS) {
        try {

            if (ip.cidrSubnet(entry).contains(clientIp)) {
                return true;
            }
        } catch (e) {

            if (clientIp === entry) {
                return true;
            }
        }
    }
    return false;
}

module.exports = {
    checkRateLimit,
    isIpWhitelisted,
};

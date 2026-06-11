const ip = require('ip');
const CONFIG = require('../core/config');
const logger = require('../core/logger');

/**
 * Проверяет, находится ли IP-адрес в белом списке.
 * Поддерживает как точные IP, так и CIDR-диапазоны.
 * @param {string} clientIp - IP-адрес клиента для проверки.
 * @returns {boolean} - true, если IP в белом списке.
 */
function isIpWhitelisted(clientIp) {

    const whitelist = CONFIG.security.INTERNAL_API_WHITELIST || [];
    if (!ip.isV4Format(clientIp) && !ip.isV6Format(clientIp)) {
        return false;
    }
    for (const entry of whitelist) {
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

/**
 * Middleware для проверки, что запрос пришел с доверенного IP-адреса.
 */
function verifyInternalRequest(req, res, next) {
    const clientIp = req.ip;

    logger.info(`[Security DEBUG] Request to ${req.originalUrl}`);
    logger.info(`[Security DEBUG] req.ip detected as: ${clientIp}`);
    logger.info(`[Security DEBUG] Whitelist contains: ${JSON.stringify(CONFIG.security.INTERNAL_API_WHITELIST)}`);

    if (isIpWhitelisted(clientIp)) {
        next();
    } else {
        logger.warn(`[Security] Отклонен запрос к внутреннему API от: ${clientIp}`);
        res.status(403).json({error: 'Access denied'});
    }
}

module.exports = {
    verifyInternalRequest
};


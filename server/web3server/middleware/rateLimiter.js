const {rateLimit} = require('express-rate-limit');
const CONFIG = require('../core/config');
const logger = require('../core/logger');

const publicApiLimiter = rateLimit({

    windowMs: CONFIG.rateLimit.WINDOW_MS,

    max: CONFIG.rateLimit.MAX_REQUESTS,

    message: {
        error: 'Too many requests, please try again later.'
    },

    standardHeaders: true,
    legacyHeaders: false,

    skip: (req, res) => {
        const clientIp = req.ip;
        const isWhitelisted = CONFIG.rateLimit.RATE_LIMIT_IP_WHITELIST.includes(clientIp);
        if (isWhitelisted) {
            logger.debug(`[RateLimiter] Пропущен лимит для IP из белого списка: ${clientIp}`);
        }
        return isWhitelisted;
    },
});

module.exports = {
    publicApiLimiter
};
const {rateLimit} = require('express-rate-limit');
const {RedisStore} = require('rate-limit-redis');
const redis = require('../core/redisClient');

const apiRateLimiter = rateLimit({

    windowMs: 10 * 60 * 1000,

    max: 100,
    message: {
        error: 'Too many requests, please try again later.'
    },
    statusCode: 429,
    headers: true,
    store: new RedisStore({
        sendCommand: (...args) => redis.redisClient.sendCommand(args),
    }),
});

module.exports = apiRateLimiter;
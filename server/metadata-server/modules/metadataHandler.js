const redis = require('../core/redisClient');
const CONFIG = require('../core/config');
const logger = require('../core/logger');

const CACHE_PREFIX = CONFIG.logic.METADATA_CACHE_KEY_PREFIX;
const LOCK_PREFIX = CONFIG.logic.LOCK_PREFIX;
const CHANNEL_PREFIX = CONFIG.logic.CHANNEL_PREFIX;
const LOCK_TTL_SECONDS = CONFIG.logic.LOCK_TTL_SECONDS;
const GENERATION_TIMEOUT_MS = CONFIG.logic.GENERATION_TIMEOUT_MS;
const CACHE_TTL_SECONDS = CONFIG.logic.METADATA_CACHE_TTL_SECONDS;
const ETAG_ENABLED = CONFIG.logic.ENABLE_ETAG_SUPPORT;

/**
 * Фабричная функция, создающая основной обработчик HTTP-запросов.
 * @param {function} generateMetadata - Готовая функция, возвращающая { metadata, etag }.
 * @returns {function} - Express-совместимый обработчик (req, res).
 */
function createMetadataHandler(generateMetadata) {

    return async function handleMetadataRequest(req, res) {
        const {tokenId} = req.params;
        const cacheKey = `${CACHE_PREFIX}${tokenId}`;

        const etagKey = `${cacheKey}:etag`;

        try {

            if (ETAG_ENABLED) {
                const clientEtag = req.get('If-None-Match');
                if (clientEtag) {
                    const cachedEtag = await redis.redisClient.get(etagKey);
                    if (cachedEtag && clientEtag.includes(cachedEtag)) {
                        logger.debug(`[Handler] ETag match для tokenId: ${tokenId}. Отправка 304.`);
                        return res.status(304).send();
                    }
                }
            }

            const cachedMetadata = await redis.redisClient.get(cacheKey);
            if (cachedMetadata) {
                logger.debug(`[Handler] Cache HIT для tokenId: ${tokenId}`);
                if (ETAG_ENABLED) {
                    const etag = await redis.redisClient.get(etagKey);
                    if (etag) res.set('ETag', `"${etag}"`);
                }
                return res.status(200).json(JSON.parse(cachedMetadata));
            }

            logger.info(`[Handler] Cache MISS для tokenId: ${tokenId}. Начинаем процесс генерации.`);

            const lockKey = `${LOCK_PREFIX}${cacheKey}`;
            const lockAcquired = await redis.redisClient.set(lockKey, '1', {NX: true, EX: LOCK_TTL_SECONDS});

            if (lockAcquired) {

                logger.info(`[Handler-Leader] Блокировка для #${tokenId} получена.`);
                let result;
                try {
                    result = await generateMetadata(tokenId);

                    if (result && result.metadata) {
                        await redis.redisClient.set(cacheKey, JSON.stringify(result.metadata), {EX: CACHE_TTL_SECONDS});
                        await redis.redisClient.set(etagKey, result.etag, {EX: CACHE_TTL_SECONDS});

                        logger.info(`[Handler-Leader] Метаданные для #${tokenId} сгенерированы. ETag: ${result.etag}`);

                        if (ETAG_ENABLED) res.set('ETag', `"${result.etag}"`);
                        res.status(200).json(result.metadata);
                    } else {
                        res.status(404).json({error: 'NFT not found'});
                    }
                } finally {

                    const message = (result && result.metadata)
                        ? JSON.stringify({metadata: result.metadata, etag: result.etag})
                        : JSON.stringify({error: 'NFT not found', status: 404});

                    await redis.redisClient.publish(`${CHANNEL_PREFIX}${cacheKey}`, message);
                    await redis.redisClient.del(lockKey);
                    logger.debug(`[Handler-Leader] Уведомление для #${tokenId} отправлено, блокировка снята.`);
                }
            } else {

                logger.info(`[Handler-Follower] Ожидаю генерацию для #${tokenId}.`);

                const result = await new Promise((resolve) => {
                    const channel = `${CHANNEL_PREFIX}${cacheKey}`;
                    const timeout = setTimeout(() => {
                        redis.redisSubscriber.unsubscribe(channel);
                        resolve({error: 'Timeout waiting for metadata generation', status: 504});
                    }, GENERATION_TIMEOUT_MS);

                    redis.redisSubscriber.subscribe(channel, (message) => {
                        clearTimeout(timeout);
                        resolve(JSON.parse(message));
                        redis.redisSubscriber.unsubscribe(channel);
                    });
                });

                if (result.error) {
                    logger.warn(`[Handler-Follower] Ошибка ожидания для #${tokenId}: ${result.error}`);
                    res.status(result.status || 500).json({error: result.error});
                } else {
                    logger.debug(`[Handler-Follower] Получено уведомление для #${tokenId}.`);

                    if (ETAG_ENABLED && result.etag) res.set('ETag', `"${result.etag}"`);
                    res.status(200).json(result.metadata);
                }
            }
        } catch (error) {
            logger.error(`[Handler] КРИТИЧЕСКАЯ ОШИБКА при обработке tokenId ${tokenId}: ${error.message}`, {stack: error.stack});
            res.status(500).json({error: 'Internal server error'});
        }
    };
}

module.exports = {createMetadataHandler};
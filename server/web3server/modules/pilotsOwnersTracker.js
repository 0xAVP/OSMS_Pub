const CONFIG = require('../core/config');
const axios = require('axios');
const logger = require('../core/logger');
const redis = require('../core/redisClient');

let lastSuccessfulUpdate = 0;
const MAX_DELAY_MS = CONFIG.game.PILOT_OWNERS_UPDATE_INTERVAL_MS * 3;

function getTrackerStatus() {
    const isHealthy = (Date.now() - lastSuccessfulUpdate) < MAX_DELAY_MS;
    return {
        isHealthy,
        lastSuccessfulUpdate: lastSuccessfulUpdate > 0 ? new Date(lastSuccessfulUpdate).toISOString() : 'Never',
    };
}

async function saveOwnersToRedis(owners) {

    let client;
    try {
        client = redis.redisClient;
        if (!client || !client.isOpen) {
            logger.error('[PILOTS-OWNERS-TRACKER]: Redis client is not connected. Cannot save owners list.');
            return;
        }
    } catch (e) {
        logger.error('[PILOTS-OWNERS-TRACKER]: Redis client not initialized yet.');
        return;
    }

    const key = CONFIG.connections.redis.REDIS_PILOT_OWNERS_KEY;
    const tempKey = `${key}:_temp_${Date.now()}`;

    try {

        if (owners && owners.length > 0) {

            await client.sAdd(tempKey, owners);

            await client.rename(tempKey, key);
            logger.info(`[PILOTS-OWNERS-TRACKER]: Список владельцев в Redis обновлен. Владельцев: ${owners.length}.`);
        } else {

            const exists = await client.exists(key);
            if (exists) {
                await client.del(key);
                logger.info(`[PILOTS-OWNERS-TRACKER]: Список владельцев пуст. Ключ ${key} удален из Redis.`);
            } else {
                logger.debug(`[PILOTS-OWNERS-TRACKER]: Список владельцев пуст, ключа в Redis не было.`);
            }
        }

    } catch (error) {
        logger.error(`[PILOTS-OWNERS-TRACKER]: Произошла ошибка при сохранении владельцев пилотов в Redis: ${error.message}`);

        try {
            await client.del(tempKey);
        } catch (e) { /* ignore cleanup error */
        }
    }
}

async function getPilotOwners() {
    try {
        const {
            ECHO_NFT_ADDRESS,
            ALCHEMY_API_URL,
            ALCHEMY_API_KEY
        } = CONFIG.blockchain.env;

        const contractAddress = ECHO_NFT_ADDRESS;
        const alchemyApiUrl = ALCHEMY_API_URL;
        const alchemyApiKey = ALCHEMY_API_KEY;

        let owners = [];
        let pageKey = null;
        let isFirstPage = true;

        do {
            const apiUrl = `${alchemyApiUrl}${alchemyApiKey}/getOwnersForContract`;
            const response = await axios.get(
                apiUrl,
                {
                    params: {
                        contractAddress: contractAddress,
                        withTokenBalances: true,
                        pageKey: pageKey || undefined
                    }
                }
            );

            const rawOwners = response.data.owners || [];

            if (isFirstPage && rawOwners.length > 0) {
                logger.info('[PILOTS-OWNERS-TRACKER] 🔍 STRUCTURE DEBUG (First Item):');

                logger.info(JSON.stringify(rawOwners[0], null, 2));
                isFirstPage = false;
            }

            const normalizedOwners = rawOwners.map(item => {
                if (typeof item === 'object' && item.ownerAddress) {
                    return item.ownerAddress.toLowerCase();
                }
                return String(item).toLowerCase();
            });

            owners = owners.concat(normalizedOwners);
            pageKey = response.data.pageKey;

        } while (pageKey);

        if (owners.length === 0) {
            logger.warn('[PILOTS-OWNERS-TRACKER]: Alchemy API не вернул ни одного владельца.');
        } else {
            logger.info(`[PILOTS-OWNERS-TRACKER]: Успешно получено ${owners.length} владельцев PilotNFT.`);
        }

        return owners;
    } catch (error) {
        logger.warn('[PILOTS-OWNERS-TRACKER]: Ошибка при получении владельцев PilotNFT от Alchemy:', error.message);
        return [];
    }
}

async function startPilotOwnersUpdate() {
    async function updateOwners() {
        try {
            const owners = await getPilotOwners();

            if (owners) {
                lastSuccessfulUpdate = Date.now();
                await saveOwnersToRedis(owners);
            }

        } catch (apiError) {
            logger.error('[PILOTS-OWNERS-TRACKER]: Критическая ошибка в цикле обновления владельцев:', apiError.message);
        }
    }

    await updateOwners();

    setInterval(updateOwners, CONFIG.game.PILOT_OWNERS_UPDATE_INTERVAL_MS);
    logger.info(`[PILOTS-OWNERS-TRACKER]: Запущено периодическое обновление списка владельцев PilotNFT (интервал: ${CONFIG.game.PILOT_OWNERS_UPDATE_INTERVAL_MS / 1000} сек)`);
}

module.exports = {startPilotOwnersUpdate, getTrackerStatus};

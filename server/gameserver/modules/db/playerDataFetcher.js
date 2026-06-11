const logger = require('../../core/logger');
const {sendToDbServer, isDbConnected, isDbIdentified} = require('./dbManager');

async function fetchPlayerData(walletAddress, shipTokenId) {
    walletAddress = walletAddress?.toLowerCase();
    if (!isDbConnected() || !isDbIdentified()) {
        logger.error('[PLAYERDATAFETCHER] Cannot fetch player data: Database server is not connected or not identified');
        throw new Error('Database server unavailable');
    }

    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
        const response = await sendToDbServer({
            type: 'get-player-data',
            requestId,
            payload: {
                walletAddress,
                shipTokenId
            }
        });

        if (response.type === 'error') {
            logger.warn(`[PLAYERDATAFETCHER] Failed to fetch player data for wallet ${walletAddress}, ship ${shipTokenId}: ${response.payload}`);
            throw new Error(response.payload);
        }

        logger.debug(`[PLAYERDATAFETCHER] Successfully fetched player data for wallet ${walletAddress}, ship ${shipTokenId}`);
        return response.payload;
    } catch (error) {
        logger.warn(`[PLAYERDATAFETCHER] Cant fetch player data for wallet ${walletAddress}, ship ${shipTokenId}: ${error.message}`);
        throw error;
    }
}

module.exports = {fetchPlayerData};
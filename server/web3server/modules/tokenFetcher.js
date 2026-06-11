const {isValidWalletAddress, isValidNumber} = require('./validation');
const {getContracts} = require('../contracts/contracts');
const logger = require('../core/logger');

const FETCH_ALL_PAGE_SIZE = 50;

async function getShipsByOwner(walletAddress, options = {}) {
    walletAddress = walletAddress?.toLowerCase();
    if (!isValidWalletAddress(walletAddress)) {
        logger.error('[TOKEN-FETCHER]: Invalid walletAddress:', walletAddress);
        return {success: false, error: 'Invalid walletAddress format'};
    }

    try {
        const {shipNFTContract} = getContracts();
        const {offset, limit} = options;

        if (isValidNumber(offset, 0, Number.MAX_SAFE_INTEGER) && isValidNumber(limit, 1, 100)) {
            logger.debug(`[TOKEN-FETCHER]: Fetching in PAGINATION mode for ${walletAddress}, offset: ${offset}, limit: ${limit}`);

            const [tokenIdsBigInt, shipTypesBigInt] = await shipNFTContract.getShipsByOwner(walletAddress, offset, limit);
            const tokenIds = tokenIdsBigInt.map(id => id.toString());
            const shipTypes = shipTypesBigInt.map(id => id.toString());

            return {success: true, tokens: tokenIds, shipTypes, owner: walletAddress};
        } else {
            logger.debug(`[TOKEN-FETCHER]: Fetching in FETCH_ALL mode for ${walletAddress}`);
            let allTokenIds = [];
            let allShipTypes = [];
            let currentOffset = 0;
            let hasMore = true;

            while (hasMore) {
                const [tokenIdsBigInt, shipTypesBigInt] = await shipNFTContract.getShipsByOwner(walletAddress, currentOffset, FETCH_ALL_PAGE_SIZE);

                if (tokenIdsBigInt.length > 0) {
                    allTokenIds.push(...tokenIdsBigInt.map(id => id.toString()));
                    allShipTypes.push(...shipTypesBigInt.map(id => id.toString()));
                }

                if (tokenIdsBigInt.length < FETCH_ALL_PAGE_SIZE) {
                    hasMore = false;
                } else {
                    currentOffset += FETCH_ALL_PAGE_SIZE;
                }
            }

            logger.info(`[TOKEN-FETCHER]: Found a total of ${allTokenIds.length} ships for wallet ${walletAddress}`);
            return {success: true, tokens: allTokenIds, shipTypes: allShipTypes, owner: walletAddress};
        }

    } catch (error) {
        logger.error(`[TOKEN-FETCHER]: Error fetching ships for ${walletAddress}:`, error.message);
        return {success: false, error: error.message};
    }
}

module.exports = {getShipsByOwner};
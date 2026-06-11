const {getShipsByOwner} = require('./tokenFetcher');
const {decode} = require('@msgpack/msgpack');
const logger = require('../core/logger');
const {safeSend} = require('../core/utils');

async function handleDbMessage(message, dbWs, pendingRequests) {
    let data;
    try {
        data = decode(message);

    } catch (error) {
        logger.error('Web3Server: Failed to parse dbServer message:', error, 'Raw (hex):', message.toString('hex'));
        return;
    }

    const {type, requestId, payload} = data;

    if (type === 'identified') {
        logger.info(`Web3Server: Successfully identified with dbServer`);
        return true;
    }

    if (type === 'fetch-ships-by-address') {
        const {walletAddress, offset, limit} = payload;

        try {

            const result = await getShipsByOwner(walletAddress, {offset, limit});
            safeSend(dbWs, 'fetch-ships-by-address-response', requestId, result);
            logger.debug(`Web3Server: Sent fetch-ships-by-address-response for ${walletAddress}`);
        } catch (error) {
            logger.error(`Web3Server: Error fetch-ships-by-address-response for ${walletAddress}:`, error.message);
            safeSend(dbWs, 'fetch-ships-by-address-response', requestId, {success: false, error: 'Web3Server error'});
        }
        return;
    }

    if (pendingRequests.has(requestId)) {
        const {resolve, reject, timeout} = pendingRequests.get(requestId);
        clearTimeout(timeout);
        pendingRequests.delete(requestId);

        if (type === 'error') {
            reject(new Error(payload));
        } else {
            resolve(data);
        }
    }
}

module.exports = {handleDbMessage};

const {getPlayerShips} = require('./ships/ships');
const {getBase} = require('./base/base');
const {getActiveBuffs} = require('./buffs/buffsManager.js');
const {handleGetLeaderboard} = require('./leaderboard/leaderboardManager');
const {safeSend} = require('../core/utils');

async function handleGameServerMessage(ws, type, payload, requestId) {
    try {
        switch (type) {
            case 'get-leaderboard':

                const lbWallet = payload.walletAddress?.toLowerCase();

                const leaderboardResult = await handleGetLeaderboard(payload, lbWallet);
                safeSend(ws, requestId, 'get-leaderboard-response', leaderboardResult);
                break;

            case 'get-player-data':

                const pDataWallet = payload.walletAddress?.toLowerCase();
                const {shipTokenId} = payload;

                if (!pDataWallet || shipTokenId === undefined) {
                    throw new Error('Invalid payload for get-player-data');
                }

                const [shipData, baseData, buffsData] = await Promise.all([
                    getPlayerShips([shipTokenId]),
                    getBase(pDataWallet),
                    getActiveBuffs(pDataWallet)
                ]);

                if (!shipData || shipData.length === 0 || !baseData.success || !buffsData.success) {
                    throw new Error('Failed to retrieve complete player data.');
                }

                const responsePayload = {
                    shipData: shipData[0],
                    baseData: baseData.base,
                    activeBuffs: buffsData.buffs
                };

                safeSend(ws, requestId, 'get-player-data-response', responsePayload);
                break;

            default:
                console.warn(`[GameServerHandler] Unknown message type received: ${type}`);

                safeSend(ws, requestId, 'error', {success: false, reason: `Unknown message type: ${type}`});
                break;
        }
    } catch (error) {
        console.error(`[GameServerHandler] Error processing '${type}' for requestId ${requestId}: ${error.message}`);

        safeSend(ws, requestId, 'error', {
            success: false,
            reason: `Server error processing '${type}': ${error.message}`
        });
    }
}

module.exports = {handleGameServerMessage};
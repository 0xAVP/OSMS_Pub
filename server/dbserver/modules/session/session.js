const mongoose = require('mongoose');
const crypto = require('crypto');
const CONFIG = require('../../core/config');
const redis = require('../../core/redisClient');
const {createPlayer} = require('../player/player');
const logger = require('../../core/logger');
const {hashSessionToken, safeSend} = require('../../core/utils');

const handleSessionMessage = async (ws, type, payload, clientInfo, requestId) => {
    switch (type) {
        case 'create-session':
            const walletAddressCreate = payload?.walletAddress?.toLowerCase();
            if (!walletAddressCreate || !/^0x[a-f0-9]{40}$/.test(walletAddressCreate)) {
                safeSend(ws, requestId, 'error', {success: false, error: 'Insuccess parameters for session creation'});
                return true;
            }

            try {
                logger.debug(`Creating session for ${walletAddressCreate} from ${clientInfo.clientType} (${clientInfo.clientId})`, `session_${walletAddressCreate}`);

                const player = await mongoose.model('players').findOne({walletAddress: walletAddressCreate}).lean();
                if (!player) {
                    await createPlayer(walletAddressCreate);
                }

                const sessionToken = crypto.randomBytes(32).toString('hex');
                const sessionTokenHash = hashSessionToken(sessionToken);
                const createdAt = Date.now();
                const sessionData = JSON.stringify({walletAddress: walletAddressCreate, createdAt});
                const sessionDurationInSeconds = CONFIG.security.SESSION_TOKEN_EXPIRY_MS / 1000;

                await redis.redisClient.set(`session:${sessionTokenHash}`, sessionData, {
                    EX: sessionDurationInSeconds
                });

                logger.debug(`Session created in Redis for ${walletAddressCreate}`, `session_${walletAddressCreate}`);
                safeSend(ws, requestId, 'session-created', {
                    sessionToken: sessionToken,
                    expiry: createdAt + CONFIG.security.SESSION_TOKEN_EXPIRY_MS,
                });

            } catch (error) {
                logger.error(`Error creating session: ${error.message}`, `session_${walletAddressCreate}`);
                safeSend(ws, requestId, 'error', {success: false, error: 'Failed to create session'});
            }
            return true;

        case 'verify-session':
            const walletAddressVerify = payload?.walletAddress?.toLowerCase();
            const tokenToVerify = payload?.sessionToken;

            if (!walletAddressVerify || !/^0x[a-f0-9]{40}$/.test(walletAddressVerify) ||
                !tokenToVerify || typeof tokenToVerify !== 'string' || tokenToVerify.length > 64) {
                safeSend(ws, requestId, 'error', {
                    success: false,
                    error: 'Invalid parameters for session verification'
                });
                return true;
            }

            try {
                logger.debug(`Verifying session for ${walletAddressVerify} from ${clientInfo.clientType} (${clientInfo.clientId})`, `session_${walletAddressVerify}`);

                const sessionTokenHash = hashSessionToken(tokenToVerify);

                const sessionJSON = await redis.redisClient.get(`session:${sessionTokenHash}`);

                if (!sessionJSON) {
                    safeSend(ws, requestId, 'session-verified', {
                        success: false,
                        error: 'Session not found or expired'
                    });
                    return true;
                }

                const session = JSON.parse(sessionJSON);
                if (session.walletAddress !== walletAddressVerify) {
                    safeSend(ws, requestId, 'session-verified', {success: false, error: 'Insuccess session token'});
                    return true;
                }

                safeSend(ws, requestId, 'session-verified', {success: true, walletAddress: walletAddressVerify});

            } catch (error) {
                logger.error(`Error verifying session: ${error.message}`, `session_${walletAddressVerify}`);
                safeSend(ws, requestId, 'error', {success: false, error: 'Server error during verification'});
            }
            return true;

        default:
            return false;
    }
}

async function verifyConnectedClientSession(sessionTokenHash) {
    if (!sessionTokenHash) {
        return {success: false, error: 'Session token hash not provided'};
    }
    try {

        const exists = await redis.redisClient.exists(`session:${sessionTokenHash}`);
        if (exists) {
            return {success: true};
        } else {
            return {success: false, error: 'Session not found or expired'};
        }
    } catch (error) {
        logger.error(`verifyConnectedClientSession: Redis error: ${error.message}`, 'session_verify');
        return {success: false, error: 'Failed to verify session'};
    }
}

async function verifyFreshSession(sessionTokenHash) {
    if (!sessionTokenHash) {
        return {success: false, error: 'Session token hash not provided'};
    }
    try {

        const remainingTTL = await redis.redisClient.ttl(`session:${sessionTokenHash}`);
        const SESSION_DURATION_SEC = CONFIG.security.SESSION_TOKEN_EXPIRY_MS / 1000;
        const FRESHNESS_WINDOW_SEC = CONFIG.security.SHORT_LIVED_SESSION_MS / 1000;

        if (remainingTTL <= 0) {
            return {success: false, error: 'Session not found or expired'};
        }

        if (remainingTTL < (SESSION_DURATION_SEC - FRESHNESS_WINDOW_SEC)) {
            const freshnessMinutes = FRESHNESS_WINDOW_SEC / 60;
            return {success: false, error: `Action requires recent re-authentication (${freshnessMinutes} min)`};
        }

        return {success: true};

    } catch (error) {
        logger.error(`verifyShortLivedSession: Redis error: ${error.message}`, 'session_verify');
        return {success: false, error: 'Failed to verify session'};
    }
}

module.exports = {handleSessionMessage, verifyConnectedClientSession, verifyFreshSession};
const logger = require('../../core/logger');
const {sendToDbServer, isDbConnected, isDbIdentified} = require('../db/dbManager');
const {gameSessions} = require('./sessions');
const CONFIG = require('../../core/config');
const axios = require("axios");
const {safeSend} = require('../../utils/networkUtils');
const {MK, MT} = require('../../core/gameStateKeys');
const redis = require("../db/redisClient");

async function verifySession(ws, walletAddress, sessionToken) {
    walletAddress = walletAddress?.toLowerCase();
    try {
        const rawRedisData = await redis.redisClient.hGet('active_game_sessions', walletAddress);

        if (rawRedisData) {

            let existingSessionId = rawRedisData;
            try {

                const parsed = JSON.parse(rawRedisData);
                if (parsed && typeof parsed === 'object' && parsed.sessionId) {
                    existingSessionId = parsed.sessionId;
                }
            } catch (e) {

            }

            logger.warn(`[SESSIONVERIFIER] Обнаружена активная сессия ${existingSessionId} для ${walletAddress}. Инициируется принудительное завершение.`);

            const message = JSON.stringify({action: 'terminate', walletAddress, reason: 'replaced_by_new_connection'});
            await redis.redisClient.publish('session_control_events', message);

            await redis.redisClient.hDel('active_game_sessions', walletAddress);
            logger.info(`[SESSIONVERIFIER] Принудительно удалена запись о сессии для ${walletAddress} из Redis.`);

            return {
                valid: false,
                reason: 'old_session_cleaned_up',
                retry: true
            };
        }
    } catch (e) {
        logger.error(`[SESSIONVERIFIER] Ошибка при проверке реестра активных сессий в Redis.`, e);
        safeSend(ws, {[MK.TYPE]: MT.ERROR, [MK.PAYLOAD]: 'Server error during session verification.'});
        return {valid: false, retry: false};
    }

    if (!isDbConnected() || !isDbIdentified()) {
        safeSend(ws, {[MK.TYPE]: MT.ERROR, [MK.PAYLOAD]: 'Database server unavailable or not identified'});
        logger.error('[SESSIONVERIFIER] Database server unavailable or not identified for session verification');
        return {valid: false};
    }

    try {
        const dbData = await sendToDbServer({
            type: 'verify-session',
            payload: {walletAddress, sessionToken}
        });

        if (dbData.type === 'session-verified' && dbData.payload.success) {
            logger.debug(`[SESSIONVERIFIER] Session verified successfully for walletAddress=${walletAddress}`);
            return {valid: true};
        } else {
            const reason = dbData.payload && dbData.payload.reason ? dbData.payload.reason : 'Invalid or expired session';
            safeSend(ws, {[MK.TYPE]: MT.ERROR, [MK.PAYLOAD]: reason});
            logger.warn(`[SESSIONVERIFIER] Session verification failed: ${reason}`);
            return {valid: false};
        }
    } catch (error) {
        safeSend(ws, {[MK.TYPE]: MT.ERROR, [MK.PAYLOAD]: 'Failed to verify session: ' + error.message});
        logger.error('[SESSIONVERIFIER] Session verification error:', error.message);
        return {valid: false};
    }
}

async function verifyPilot(pilotId, walletAddress, ws, retryCount = 0) {
    walletAddress = walletAddress?.toLowerCase();
    try {
        const response = await axios.get(`${CONFIG.connections.web3Server.URL}/internal/api/v1/verify-pilot/${pilotId}/${walletAddress}`, {
            timeout: CONFIG.connections.web3Server.REQUEST_TIMEOUT_MS
        });

        if (!response || !response.data) {
            const reason = 'Pilot verification received empty response';
            logger.warn(`[SESSIONVERIFIER] ${reason}`);
            safeSend(ws, {[MK.TYPE]: MT.ERROR, [MK.PAYLOAD]: reason});
            return {valid: false};
        }

        const pilotData = response.data;

        if (!pilotData.success) {
            const reason = pilotData.reason || 'Pilot verification failed';
            logger.warn(`[SESSIONVERIFIER] Pilot verification failed: ${reason}`);
            safeSend(ws, {[MK.TYPE]: MT.ERROR, [MK.PAYLOAD]: reason});
            return {valid: false};
        }
        return {valid: true, bonuses: pilotData.bonuses || {}};
    } catch (error) {
        logger.warn(`[SESSIONVERIFIER] Error verifying pilot (Attempt ${retryCount + 1}): ${error.message}`);

        const status = error.response ? error.response.status : null;

        if (status === 400 || status === 404 || (error.response?.data?.success === false)) {
            logger.error(`[SESSIONVERIFIER] Final error verifying pilot: ${error.message}`);
            return {valid: false};
        }

        if (retryCount < CONFIG.connections.web3Server.MAX_RETRIES - 1) {
            await new Promise(resolve => setTimeout(resolve, CONFIG.connections.web3Server.RETRY_DELAY_MS));
            return verifyPilot(pilotId, walletAddress, ws, retryCount + 1);
        }

        const reason = `[SESSIONVERIFIER]All retries exhausted for pilot verification: ${error.message}`;
        logger.warn(reason);
        safeSend(ws, {[MK.TYPE]: MT.ERROR, [MK.PAYLOAD]: reason});
        return {valid: false};
    }
}

async function verifyShip(shipTokenId, walletAddress, ws, retryCount = 0) {
    walletAddress = walletAddress?.toLowerCase();
    try {
        const response = await axios.get(`${CONFIG.connections.web3Server.URL}/internal/api/v1/verify-ship/${shipTokenId}/${walletAddress}`, {
            timeout: CONFIG.connections.web3Server.REQUEST_TIMEOUT_MS
        });

        if (!response || !response.data) {
            const reason = 'Ship verification received empty response';
            logger.warn(`[SESSIONVERIFIER] ${reason}`);
            safeSend(ws, {[MK.TYPE]: MT.ERROR, [MK.PAYLOAD]: reason});
            return {valid: false};
        }

        const shipData = response.data;

        if (!shipData.success) {
            const reason = shipData.reason || 'Ship verification failed';
            logger.warn(`[SESSIONVERIFIER] Ship verification failed: ${reason}`);
            safeSend(ws, {[MK.TYPE]: MT.ERROR, [MK.PAYLOAD]: reason});
            return {valid: false};
        }

        return {valid: true};
    } catch (error) {
        logger.warn(`[SESSIONVERIFIER]Error verifying ship (Attempt ${retryCount + 1}): ${error.message}`);

        const status = error.response ? error.response.status : null;
        if (status === 400 || status === 404 || (error.response?.data?.success === false)) {
            logger.warn(`[SESSIONVERIFIER] Final error verifying ship: ${error.message}`);
            return {valid: false};
        }

        if (retryCount < CONFIG.connections.web3Server.MAX_RETRIES - 1) {
            await new Promise(resolve => setTimeout(resolve, CONFIG.connections.web3Server.RETRY_DELAY_MS));
            return verifyShip(shipTokenId, walletAddress, ws, retryCount + 1);
        }

        const reason = `[SESSIONVERIFIER] All retries exhausted for ship verification: ${error.message}`;
        logger.warn(reason);
        safeSend(ws, {[MK.TYPE]: MT.ERROR, [MK.PAYLOAD]: reason});
        return {valid: false};
    }
}

module.exports = {verifySession, verifyShip, verifyPilot};
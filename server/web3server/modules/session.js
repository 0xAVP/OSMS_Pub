const CONFIG = require('../core/config');
const {generateRequestId, safeSend} = require('../core/utils');

function waitForDbResponse(dbWs, type, requestId, pendingRequests) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            if (pendingRequests.has(requestId)) {
                pendingRequests.delete(requestId);
                reject(new Error('Timeout waiting for dbServer response'));
            }
        }, CONFIG.timeouts.DB_RESPONSE_TIMEOUT_MS);

        pendingRequests.set(requestId, {resolve, reject, timeout});
    });
}

async function createSession(dbWs, walletAddress, pendingRequests) {
    if (!dbWs || dbWs.readyState !== WebSocket.OPEN) {
        throw new Error('WebSocket connection to dbServer is not open');
    }

    const requestId = generateRequestId();

    safeSend(dbWs, 'create-session', requestId, {walletAddress});

    const dbData = await waitForDbResponse(dbWs, 'session-created', requestId, pendingRequests);
    if (!dbData.payload.sessionToken && !dbData.payload.expiry) {
        throw new Error('Failed to create session');
    } else {
        return {
            sessionToken: dbData.payload.sessionToken,
            expiry: dbData.payload.expiry,
            createdAt: dbData.payload.createdAt
        };
    }

}

async function verifySession(dbWs, walletAddress, sessionToken, pendingRequests) {
    if (!dbWs || dbWs.readyState !== WebSocket.OPEN) {
        throw new Error('WebSocket connection to dbServer is not open');
    }
    const requestId = generateRequestId();

    safeSend(dbWs, 'verify-session', requestId, {walletAddress, sessionToken});

    const dbData = await waitForDbResponse(dbWs, 'session-verified', requestId, pendingRequests);
    if (dbData.payload.success) {
        return true;
    } else {
        return false;
    }
}

module.exports = {createSession, verifySession};
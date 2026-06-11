const {encode} = require('@msgpack/msgpack');
const CONFIG = require("./config");

const generateRequestId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

function safeSend(ws, type, requestId, payload) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(encode({type, requestId, payload}));
    } else {
        console.warn(`[Web3Server safeSend] Попытка отправки сообщения типа '${type}' на закрытое соединение.`);
    }
}

function waitForDbResponse(dbWs, responseType, requestId, pendingRequests) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            if (pendingRequests.has(requestId)) {
                pendingRequests.delete(requestId);
                reject(new Error(`Timeout waiting for dbServer response type: ${responseType}`));
            }
        }, CONFIG.timeouts.DB_RESPONSE_TIMEOUT_MS);

        pendingRequests.set(requestId, {resolve, reject, timeout});
    });
}

module.exports = {generateRequestId, safeSend, waitForDbResponse};
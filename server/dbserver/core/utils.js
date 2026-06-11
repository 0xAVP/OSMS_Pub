const crypto = require('crypto');
const WebSocket = require('ws');
const CONFIG = require('./config');
const {encode} = require('@msgpack/msgpack');

function hashSessionToken(token) {
    if (!token) return null;
    return crypto.createHash('sha256').update(token).digest('hex');
}

function safeSend(ws, requestId, type, payload) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(encode({type, requestId, payload}));
    } else {
        console.warn(`[safeSend] Попытка отправки сообщения типа '${type}' на закрытое соединение.`);
    }
}

/**
 * [НОВАЯ ФУНКЦИЯ]
 * Корректно определяет IP-адрес клиента, учитывая, работает ли сервер за прокси.
 * @param {object} req - Объект запроса из события 'connection' WebSocket-сервера.
 * @returns {string|undefined} IP-адрес клиента.
 */
function getClientIp(req) {
    if (CONFIG.server.TRUST_PROXY) {

        const forwardedFor = req.headers['x-forwarded-for'];
        if (forwardedFor && typeof forwardedFor === 'string') {
            return forwardedFor.split(',')[0].trim();
        }
    }

    return req.socket?.remoteAddress?.replace(/^::ffff:/, '');
}

module.exports = {hashSessionToken, safeSend, getClientIp};
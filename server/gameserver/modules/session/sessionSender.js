const WebSocket = require('ws');
const {safeSend} = require('../../utils/networkUtils');
const {MK, MT} = require('../../core/gameStateKeys');
const logger = require("../../core/logger");

function sendSessionStarted(ws, session, preparedShip) {
    if (ws.readyState !== WebSocket.OPEN) {
        logger.error(`[SESSIONSENDER] WebSocket not open for session ${session.sessionId}`);
        return;
    }

    const cm = session.componentManager;
    const playerPosition = cm.getComponent(session.playerEntityId, 'position');
    const playerRender = cm.getComponent(session.playerEntityId, 'render');

    const payload = {
        sessionId: session.sessionId,
        reconnectToken: session.reconnectToken,
        initialPosition: {
            x: playerPosition.x,
            y: playerPosition.y
        },
        playerShip: {
            ...preparedShip,
            shipSize: playerRender.size
        },
        initialBaseHp: session.playerBaseHp,
        lootDictionary: session.lootDictionary,
        serverTime: Date.now()
    };

    safeSend(ws, {
        [MK.TYPE]: MT.SESSION_STARTED,
        [MK.PAYLOAD]: payload
    });

    logger.debug(`[SESSIONSENDER] Session started message sent for ${session.sessionId}, lootDictionary contains ${Object.keys(session.lootDictionary || {}).length} items.`);
}

module.exports = {sendSessionStarted};
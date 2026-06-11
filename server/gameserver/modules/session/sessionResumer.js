const logger = require('../../core/logger');
const {SESSION_STATES} = require('./sessionStates');
const replicationSystem = require('../replicationSystem');

const DeltaCompressor = require('../../modules/deltaCompressor');
const {gameSessions} = require('./sessions');
const {safeSend} = require('../../utils/networkUtils');
const {MK, MT} = require('../../core/gameStateKeys');

/**
 * Восстанавливает приостановленную сессию.
 * @param {object} session - Объект сессии из gameSessions.
 * @param {WebSocket} newWs - Новый сокет клиента.
 * @returns {boolean} Успех операции.
 */
function resumeSession(session, newWs) {
    if (!session) {
        logger.error('[SessionResumer] Попытка восстановить несуществующую сессию.');
        return false;
    }

    logger.info(`[SessionResumer] Восстановление сессии ${session.sessionId} для ${session.player}.`);

    if (session.disconnectTimeout) {
        clearTimeout(session.disconnectTimeout);
        session.disconnectTimeout = null;
    }

    if (session.ws && session.ws !== newWs) {
        try {
            session.ws.terminate();
        } catch (e) { /* ignore */
        }
    }

    session.ws = newWs;
    newWs.sessionId = session.sessionId;

    session.lastUpdate = Date.now();
    session.lastHeartbeatTime = Date.now();

    const currentState = session.stateManager ? session.stateManager.currentState : null;
    const stateName = currentState ? currentState.name : 'Unknown';

    if (stateName === 'PostBossDelay') {

        session.status = SESSION_STATES.POST_BOSS_DELAY;
        logger.info(`[SessionResumer] Восстановлен статус POST_BOSS_DELAY. Отправка UI таймера.`);

        if (typeof currentState.sendDelayMessage === 'function') {
            currentState.sendDelayMessage();
        }
    } else if (stateName === 'Preparation') {

        session.status = SESSION_STATES.PREPARATION;
        logger.info(`[SessionResumer] Восстановлен статус PREPARATION. Отправка обратного отсчета.`);

        if (typeof currentState.sendCountdownMessage === 'function') {
            currentState.sendCountdownMessage();
        }
    } else {

        session.status = SESSION_STATES.ACTIVE;
    }

    if (session.replication) {
        session.replication.knownEnemyIds.clear();
        session.replication.knownBulletIds.clear();
        session.replication.knownPowerUpIds.clear();

        session.replication.destroyedEnemyIds = [];
        session.replication.destroyedBulletIds = [];
        session.replication.destroyedPowerUpIds = [];

        session.replication.deltaCompressor = new DeltaCompressor();

        logger.info(`[SessionResumer] История репликации сброшена для полной синхронизации.`);
    }

    try {
        replicationSystem.generateAndSendState(session);
        logger.info(`[SessionResumer] Сессия ${session.sessionId} успешно восстановлена.`);
        return true;
    } catch (err) {
        logger.error(`[SessionResumer] Ошибка при отправке стейта: ${err.message}`);

        return true;
    }
}

/**
 * Обрабатывает запрос на реконнект.
 * (Эта функция нужна, чтобы разорвать бесконечный цикл, если воркер перезагрузился)
 */
function handleReconnectRequest(ws, payload) {
    const {reconnectToken, walletAddress} = payload;
    const normalizedWallet = walletAddress?.toLowerCase();

    let foundSession = null;
    for (const session of gameSessions.values()) {
        if (session.reconnectToken === reconnectToken && session.player === normalizedWallet) {
            foundSession = session;
            break;
        }
    }

    if (foundSession) {
        const success = resumeSession(foundSession, ws);
        if (!success) {
            safeSend(ws, {
                [MK.TYPE]: MT.ERROR,
                [MK.PAYLOAD]: 'Internal resume error'
            });
        }
    } else {

        logger.warn(`[SessionResumer] Reconnect failed for ${normalizedWallet}. Session not found in memory.`);
        safeSend(ws, {
            [MK.TYPE]: MT.RECONNECT_FAILED,
            [MK.PAYLOAD]: {
                reason: 'Session lost or worker restarted',
                retry: false
            }
        });
    }
}

module.exports = {resumeSession, handleReconnectRequest};

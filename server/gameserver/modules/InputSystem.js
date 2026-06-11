const CONFIG = require('../core/config');
const {validatePlayerFireAction} = require('./entities/playerBullets');
const {safeSend} = require('../utils/networkUtils');
const WebSocket = require('ws');
const {MK, MT, CAK} = require('../core/gameStateKeys');
const logger = require("../core/logger");

class InputSystem {
    /**
     * Оптимизированный метод очистки истории действий.
     * Удаляет старые записи из Map напрямую, не создавая промежуточных массивов.
     * @param {Map} actionHistoryMap - Карта с историей действий.
     * @private
     */
    _cleanupOldActions(actionHistoryMap) {
        const now = Date.now();
        const expirationTime = now - CONFIG.validation.PLAYER_ACTIONS_TTL;

        for (const [actionId, action] of actionHistoryMap.entries()) {
            if (action.timestamp < expirationTime) {
                actionHistoryMap.delete(actionId);
            }
        }
    }

    process(session, ws) {

        if (!session.inputQueue || session.inputQueue.length === 0) {
            return;
        }

        const actionsToProcess = [...session.inputQueue];
        session.inputQueue.length = 0;

        const playerEntityId = session.playerEntityId;
        const cm = session.componentManager;
        const positionComponent = cm.getComponent(playerEntityId, 'position');
        const engineStatsComponent = cm.getComponent(playerEntityId, 'engine_stats');
        const actionHistoryComponent = cm.getComponent(playerEntityId, 'action_history');
        if (!positionComponent || !engineStatsComponent || !actionHistoryComponent) return;
        const inventory = cm.getComponent(playerEntityId, 'weapon_inventory');

        const scaleFactor = session.speedScaleFactor || 1.0;
        const baseSpeed = engineStatsComponent.speed / scaleFactor;

        let lastValidX = positionComponent.x;
        let lastValidY = positionComponent.y;
        let lastValidTimestamp = session.lastActionTime;

        for (const actionArray of actionsToProcess) {
            const x = actionArray[CAK.X_COORD];
            const y = actionArray[CAK.Y_COORD];
            const timestamp = actionArray[CAK.TIMESTAMP];

            if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(timestamp)) {
                return;
            }

            const timeDelta = (timestamp - lastValidTimestamp) / 1000.0;
            if (timeDelta < 0) return;
            if (timeDelta === 0) continue;

            const normalizedX = x / scaleFactor;
            const normalizedY = y / scaleFactor;
            const normalizedLastValidX = lastValidX / scaleFactor;
            const normalizedLastValidY = lastValidY / scaleFactor;

            const dx = normalizedX - normalizedLastValidX;
            const dy = normalizedY - normalizedLastValidY;
            const distanceTraveledNormalized = Math.sqrt(dx * dx + dy * dy);

            const maxAllowedDistance = baseSpeed * timeDelta + (CONFIG.game.antiCheat.POSITION_TOLERANCE_PX / scaleFactor);

            if (distanceTraveledNormalized > maxAllowedDistance) {
                session.positionRejections = (session.positionRejections || 0) + 1;
                logger.warn(`Teleport rejected: Traveled normalized ${distanceTraveledNormalized.toFixed(2)}px > max allowed ${maxAllowedDistance.toFixed(2)}px in ${timeDelta.toFixed(4)}s. Scale: ${scaleFactor.toFixed(2)}`);

                if (ws && ws.readyState === WebSocket.OPEN) {
                    safeSend(ws, {
                        [MK.TYPE]: MT.POSITION_REJECTED,
                        [MK.PAYLOAD]: {serverX: positionComponent.x, serverY: positionComponent.y}
                    });
                }
                return;
            }
            lastValidX = x;
            lastValidY = y;
            lastValidTimestamp = timestamp;
        }

        let finalActionArray = null;
        for (const actionArray of actionsToProcess) {
            const actionId = actionArray[CAK.ACTION_ID];
            const isFireAction = actionArray.length > CAK.FIRE && actionArray[CAK.FIRE] === 1;

            const actionObject = {
                x: actionArray[CAK.X_COORD],
                y: actionArray[CAK.Y_COORD],
                timestamp: actionArray[CAK.TIMESTAMP],
                actionId: actionId,
                fire: isFireAction ? {} : null,
                activeWeaponSlot: inventory ? inventory.activeSlot : 'weapon1',
                hitsByPellet: new Map()
            };

            actionHistoryComponent.set(actionId, actionObject);

            if (isFireAction) {

                validatePlayerFireAction(session, actionObject, ws);
            }
            finalActionArray = actionArray;
        }

        this._cleanupOldActions(actionHistoryComponent);

        if (finalActionArray) {

            positionComponent.x = finalActionArray[CAK.X_COORD];
            positionComponent.y = finalActionArray[CAK.Y_COORD];

            const spatialGrid = session.spatialGrid;
            const newGridKey = spatialGrid.getKeyForPos(positionComponent.x, positionComponent.y);
            const oldGridKey = positionComponent._gridKey;

            if (newGridKey !== oldGridKey) {
                spatialGrid.update(playerEntityId, oldGridKey, newGridKey);
                positionComponent._gridKey = newGridKey;
            }

            session.lastActionTime = finalActionArray[CAK.TIMESTAMP];
            const inputComponent = cm.getComponent(playerEntityId, 'player_input');
            if (inputComponent) {
                inputComponent.lastProcessedActionId = finalActionArray[CAK.ACTION_ID];
            }
        }
    }
}

module.exports = new InputSystem();
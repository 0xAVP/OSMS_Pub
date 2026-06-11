const System = require('./System');
const logger = require("../../../core/logger");

class HistorySystem extends System {
    constructor() {
        super();
        logger.info('[ECS:HistorySystem] Initialized.');
    }

    update(session, now) {
        const cm = session.componentManager;
        const snapshotPool = session.componentPoolManager;

        /**
         * Внутренняя функция-помощник для создания и добавления исторического снимка (snapshot).
         * Инкапсулирует всю логику работы с одной сущностью.
         * @param {number} entityId - ID сущности для создания снимка.
         */
        const addHistorySnapshot = (entityId) => {

            const position = cm.getComponent(entityId, 'position');
            const history = cm.getComponent(entityId, 'position_history');
            const render = cm.getComponent(entityId, 'render');
            if (!position || !history || !render) {
                return;
            }

            let halfWidth, halfHeight;
            if (render.hitboxRadius) {
                halfWidth = render.hitboxRadius;
                halfHeight = render.hitboxRadius;
            } else if (render.size) {
                halfWidth = render.size.width / 2;
                halfHeight = render.size.height / 2;
            } else {

                return;
            }

            const newSnapshot = snapshotPool.acquire('history_snapshot');

            newSnapshot.timestamp = now;
            newSnapshot.xMin = position.x - halfWidth;
            newSnapshot.xMax = position.x + halfWidth;
            newSnapshot.yMin = position.y - halfHeight;
            newSnapshot.yMax = position.y + halfHeight;

            const overwrittenSnapshot = history.push(newSnapshot);

            if (overwrittenSnapshot) {
                snapshotPool.release('history_snapshot', overwrittenSnapshot);
            }
        };

        addHistorySnapshot(session.playerEntityId);

        for (const entityId of session.activeEntities.enemies) {
            addHistorySnapshot(entityId);
        }
        for (const entityId of session.activeEntities.enemyBullets) {
            addHistorySnapshot(entityId);
        }
        for (const entityId of session.activeEntities.powerUps) {
            addHistorySnapshot(entityId);
        }
    }
}

module.exports = new HistorySystem();
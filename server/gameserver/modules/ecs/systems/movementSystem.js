const System = require('./System');
const logger = require("../../../core/logger");

class MovementSystem extends System {
    constructor() {
        super();
        logger.info('[ECS:MovementSystem] Initialized.');
    }

    /**
     * Обновляет позицию сущности на основе ее скорости и управляет ее регистрацией
     * в SpatialGrid, минимизируя операции записи.
     * @param {number} entityId ID сущности.
     * @param {object} session Игровая сессия.
     * @param {number} delta Время, прошедшее с последнего кадра (в секундах).
     */
    update(entityId, session, delta) {

        const cm = session.componentManager;
        const position = cm.getComponent(entityId, 'position');
        const velocity = cm.getComponent(entityId, 'velocity');

        if (!position || !velocity) {
            return;
        }

        position.x += velocity.x * delta;
        position.y += velocity.y * delta;

        const spatialGrid = session.spatialGrid;

        const newGridKey = spatialGrid.getKeyForPos(position.x, position.y);

        if (newGridKey !== position._gridKey) {

            spatialGrid.update(entityId, position._gridKey, newGridKey);

            position._gridKey = newGridKey;
        }
    }

}

module.exports = new MovementSystem();
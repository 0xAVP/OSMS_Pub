const logger = require("../core/logger");

class CleanupSystem {
    constructor() {
        logger.info('[ECS:CleanupSystem] Initialized. (Now simplified)');
    }

    /**
     * Физически удаляет сущности и их компоненты из ECS.
     * Не возвращает никаких данных.
     * @param {object} session - Игровая сессия.
     */
    process(session) {
        if (!session.entitiesToDestroy || session.entitiesToDestroy.size === 0) {
            return;
        }

        const em = session.entityManager;
        const cm = session.componentManager;
        const spatialGrid = session.spatialGrid;
        const staticSpawnGrid = session.staticSpawnGrid;

        for (const entityId of session.entitiesToDestroy) {
            const gridOccupantComponent = cm.getComponent(entityId, 'static_grid_occupant');
            if (gridOccupantComponent) {

                staticSpawnGrid.releaseCell(gridOccupantComponent);

                cm.removeComponent(entityId, 'static_grid_occupant');
            }
            const position = cm.getComponent(entityId, 'position');
            if (position && position._gridKey) {
                spatialGrid.remove(entityId, position._gridKey);
            }
            cm.destroyEntityComponents(entityId, session);
            em.destroyEntity(entityId);
        }

        session.entitiesToDestroy.clear();

    }
}

module.exports = new CleanupSystem();
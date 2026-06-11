const logger = require("../../../core/logger");

class GeometryUpdateSystem {
    constructor() {
        logger.info('[ECS:GeometryUpdateSystem] Initialized.');
    }

    /**
     * Обновляет геометрию для всех сущностей с collision_geometry.
     * @param {object} session - Игровая сессия.
     */
    update(session) {
        const cm = session.componentManager;
        const geometryStore = cm.componentStores.get('collision_geometry');

        if (!geometryStore) {
            return;
        }

        for (const [entityId, geo] of geometryStore.entries()) {
            const pos = cm.getComponent(entityId, 'position');
            if (!pos) {
                continue;
            }

            if (geo.isCircle) {

                geo.aabb.x = pos.x - geo.radius;
                geo.aabb.y = pos.y - geo.radius;
            } else {

                geo.aabb.x = pos.x - geo.width / 2;
                geo.aabb.y = pos.y - geo.height / 2;
            }
        }

    }
}

module.exports = new GeometryUpdateSystem();
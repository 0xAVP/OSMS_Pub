const System = require('./System');
const logger = require("../../../core/logger");

class PlayerBoundarySystem extends System {
    constructor() {
        super();
        logger.info('[ECS:PlayerBoundarySystem] Initialized.');
    }

    update(cm, session) {

        const playerControlledEntities = cm.componentStores.get('player_controlled');
        if (!playerControlledEntities) return;

        for (const entityId of playerControlledEntities.keys()) {
            const position = cm.getComponent(entityId, 'position');
            if (!position) continue;

            position.x = Math.max(0, Math.min(session.width, position.x));
            position.y = Math.max(0, Math.min(session.height, position.y));
        }
    }
}

module.exports = new PlayerBoundarySystem();
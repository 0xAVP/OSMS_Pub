const System = require('./System');
const logger = require('../../../core/logger');

const OFFSCREEN_TTL_MS = 5000;

class OffscreenCleanupSystem extends System {
    constructor() {
        super();
        logger.info('[ECS:OffscreenCleanupSystem] Initialized.');
    }

    update(session) {
        const em = session.entityManager;
        const cm = session.componentManager;
        const now = Date.now();

        for (const entityId of em.entityComponentSignatures.keys()) {

            if (entityId === session.playerEntityId || cm.getComponent(entityId, 'pending_destruction')) {
                continue;
            }

            const position = cm.getComponent(entityId, 'position');
            if (!position) continue;

            const isVisible = position.x >= 0 && position.x <= session.width &&
                position.y >= 0 && position.y <= session.height;

            const ttlComponent = cm.getComponent(entityId, 'offscreen_ttl');

            if (!isVisible && !ttlComponent) {

                cm.addComponent(entityId, 'offscreen_ttl', {destroyAt: now + OFFSCREEN_TTL_MS});

            } else if (isVisible && ttlComponent) {

                cm.removeComponent(entityId, 'offscreen_ttl');

            } else if (ttlComponent && now >= ttlComponent.destroyAt) {

                logger.warn(`[OffscreenCleanup] Принудительное удаление сущности ${entityId}, зависшей за экраном.`);
                cm.addComponent(entityId, 'pending_destruction', {reason: 'offscreen_cleanup'});
            }
        }
    }
}

module.exports = new OffscreenCleanupSystem();
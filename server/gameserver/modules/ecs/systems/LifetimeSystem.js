const System = require('./System');
const logger = require('../../../core/logger');

class LifetimeSystem extends System {
    constructor() {
        super();
        logger.info('[ECS:LifetimeSystem] Initialized.');
    }

    /**
     * Проверяет все сущности с компонентом 'lifetime' на истечение срока их жизни.
     * @param {object} session - Игровая сессия.
     */
    update(session) {
        const cm = session.componentManager;

        const lifetimeStore = cm.componentStores.get('lifetime');

        if (!lifetimeStore || lifetimeStore.size === 0) {
            return;
        }

        const now = Date.now();

        for (const [entityId, lifetime] of lifetimeStore.entries()) {
            if (cm.getComponent(entityId, 'pending_destruction')) {
                continue;
            }

            if (now >= lifetime.expiresAt) {
                cm.addComponent(entityId, 'pending_destruction', {reason: 'expired'});

                cm.removeComponent(entityId, 'lifetime');
            }
        }
    }
}

module.exports = new LifetimeSystem();
const System = require('./System');
const CONFIG = require('../../../core/config');
const logger = require("../../../core/logger");

class ShieldRegenSystem extends System {
    constructor() {
        super();
        logger.info('[ECS:ShieldRegenSystem] Initialized.');
    }

    update(session, delta) {
        const now = Date.now();
        const cm = session.componentManager;
        const healthStores = cm.componentStores.get('health');
        if (!healthStores) return;

        for (const [entityId, health] of healthStores.entries()) {

            if (now - health.lastHitTimestamp > health.shieldRegenDelay) {

                const cachedStats = cm.getComponent(entityId, 'cached_stats');

                if (!cachedStats) continue;

                const currentMaxShield = cachedStats.maxShield;
                const currentShieldRegen = cachedStats.shieldRegen;

                if (health.shield < currentMaxShield) {
                    health.shield = Math.min(
                        currentMaxShield,
                        health.shield + currentShieldRegen * delta
                    );
                }
            }
        }
    }
}

module.exports = new ShieldRegenSystem();
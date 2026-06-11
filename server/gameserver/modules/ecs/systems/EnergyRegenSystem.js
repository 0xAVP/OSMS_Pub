const System = require('./System');
const logger = require("../../../core/logger");

class EnergyRegenSystem extends System {
    constructor() {
        super();
        logger.info('[ECS:EnergyRegenSystem] Initialized.');
    }

    update(session, delta) {
        const cm = session.componentManager;
        const energyStores = cm.componentStores.get('energy');
        if (!energyStores) return;

        for (const [entityId, energy] of energyStores.entries()) {

            const cachedStats = cm.getComponent(entityId, 'cached_stats');

            if (!cachedStats) continue;

            const currentEnergyRegen = cachedStats.energyRegen;

            if (energy.current < energy.capacity) {
                energy.current = Math.min(
                    energy.capacity,
                    energy.current + currentEnergyRegen * delta
                );
            }
        }
    }
}

module.exports = new EnergyRegenSystem();
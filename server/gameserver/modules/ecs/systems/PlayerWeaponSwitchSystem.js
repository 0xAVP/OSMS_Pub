const System = require('./System');
const CONFIG = require('../../../core/config');
const logger = require("../../../core/logger");

class PlayerWeaponSwitchSystem extends System {
    constructor() {
        super();
        logger.info('[ECS:PlayerWeaponSwitchSystem] Initialized.');
    }

    process(session) {
        const cm = session.componentManager;

        if (!cm) {
            return;
        }

        const switchRequests = cm.componentStores.get('weapon_switch_request');

        if (!switchRequests || switchRequests.size === 0) {
            return;
        }

        for (const entityId of switchRequests.keys()) {

            const now = Date.now();
            const cooldowns = cm.getComponent(entityId, 'cooldowns');
            const inventory = cm.getComponent(entityId, 'weapon_inventory');

            if (!cooldowns || !inventory) continue;

            if (now - cooldowns.lastWeaponSwitch < CONFIG.game.PLAYER_WEAPON_SWITCH_COOLDOWN_MS) {

            } else {

                if (inventory.weapons.weapon2) {

                    const currentSlot = inventory.activeSlot;
                    inventory.activeSlot = (currentSlot === 'weapon1') ? 'weapon2' : 'weapon1';

                    cooldowns.lastWeaponSwitch = now;
                    cm.addComponent(entityId, 'stats_dirty', {});
                }
            }

            cm.removeComponent(entityId, 'weapon_switch_request');
        }
    }
}

module.exports = new PlayerWeaponSwitchSystem();
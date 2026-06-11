const System = require('./System');

const logger = require("../../../core/logger");

class WeaponSwitchSystem extends System {
    constructor() {
        super();
        logger.info('[ECS:WeaponSwitchSystem] Initialized.');
    }

    /**
     * Проверяет наличие запросов на смену оружия и выполняет их,
     * напрямую изменяя компонент weaponState.
     */
    update(entityId, cm, now) {
        const weaponState = cm.getComponent(entityId, 'weaponState');

        if (!weaponState || weaponState.requestedWeaponIndex === null) {
            return;
        }

        const targetIndex = weaponState.requestedWeaponIndex;

        weaponState.requestedWeaponIndex = null;

        if (targetIndex === weaponState.activeWeaponIndex) {
            return;
        }

        if (!weaponState.weapons || !Array.isArray(weaponState.weapons) || !weaponState.weapons[targetIndex]) {

            return;
        }

        const newWeapon = weaponState.weapons[targetIndex].weapon;

        weaponState.activeWeaponIndex = targetIndex;
        weaponState.fireRate = newWeapon.fireRate || 0;
        weaponState.bulletType = newWeapon.bulletType || '';
        weaponState.bulletSize = newWeapon.bulletSize || {width: 0, height: 0};
        weaponState.bulletDamage = newWeapon.bulletDamage || 0;
        weaponState.bulletLifetimeMs = newWeapon.bulletLifetimeMs || null;
        weaponState.lastFired = now;
        weaponState.lastWeaponChange = now;

        logger.debug(`[WeaponSwitchSystem] Entity ${entityId} switched to weapon index ${targetIndex}.`);

    }
}

module.exports = new WeaponSwitchSystem();
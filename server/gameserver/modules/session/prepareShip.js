const {SHIP_CONFIGS} = require('../../objects/players/shipConfigs');
const {getWeaponMechanics} = require('../../core/weaponMechanicsStore');
const CONFIG = require('../../core/config');

const {REFERENCE_WIDTH, REFERENCE_HEIGHT} = CONFIG.validation.scaling;

/**
 * Модифицирует объект корабля, применяя к его параметрам все бонусы.
 * @param {object} playerShip - Объект корабля, который будет изменен.
 */
function applyShipBonuses(playerShip) {
    const bonuses = playerShip.bonuses;
    if (!bonuses || Object.keys(bonuses).length === 0) {
        return;
    }

    for (const bonusKey in bonuses) {
        const bonusValue = bonuses[bonusKey];
        const multiplier = 1 + (bonusValue / 100);

        switch (bonusKey) {

            case 'hullAmountBonusPercent':
                playerShip.hull = Math.round(playerShip.hull * multiplier);
                break;

            case 'damageBonusPercent':
                ['weapon1', 'weapon2'].forEach(slot => {
                    const module = playerShip.modules.weapons[slot]?.module;
                    if (module?.params?.damage) {
                        module.params.damage.min *= multiplier;
                        module.params.damage.max *= multiplier;
                    }
                });
                break;
            case 'critChanceBonusPercent':
                ['weapon1', 'weapon2'].forEach(slot => {
                    const module = playerShip.modules.weapons[slot]?.module;
                    if (module?.params?.critical) {

                        module.params.critical.chance *= multiplier;
                    }
                });
                break;
            case 'critDamageBonusPercent':
                ['weapon1', 'weapon2'].forEach(slot => {
                    const module = playerShip.modules.weapons[slot]?.module;
                    if (module?.params?.critical) {

                        module.params.critical.modifier *= multiplier;
                    }
                });
                break;

            case 'shieldCapacityBonusPercent':
                playerShip.modules.shield.module.params.shield.capacity = Math.round(playerShip.modules.shield.module.params.shield.capacity * multiplier);
                break;
            case 'shieldRegenBonusPercent':
                playerShip.modules.shield.module.params.shield.regen = Number((playerShip.modules.shield.module.params.shield.regen * multiplier).toFixed(1));
                break;
            case 'shieldDelayStartRegenBonusPercent':

                const delayMultiplier = 1 - (bonusValue / 100);
                playerShip.modules.shield.module.params.shield.delay = Math.round(playerShip.modules.shield.module.params.shield.delay * delayMultiplier);
                break;

            case 'armorCapacityBonusPercent':
                playerShip.modules.armor.module.params.armor.capacity = Math.round(playerShip.modules.armor.module.params.armor.capacity * multiplier);
                break;
            case 'armorAbsorptionChanceBonusPercent':
                playerShip.modules.armor.module.params.absorption.chance *= multiplier;
                break;
            case 'armorAbsorptionAmountBonusPercent':
                playerShip.modules.armor.module.params.absorption.absorb = Math.round(playerShip.modules.armor.module.params.absorption.absorb * multiplier);
                break;

            case 'evasionChanceBonusPercent':
                playerShip.modules.engine.module.params.evasion *= multiplier;
                break;
            case 'energyCapacityBonusPercent':
                playerShip.modules.engine.module.params.energy.capacity = Math.round(playerShip.modules.engine.module.params.energy.capacity * multiplier);
                break;
            case 'energyRegenBonusPercent':
                playerShip.modules.engine.module.params.energy.regen = Number((playerShip.modules.engine.module.params.energy.regen * multiplier).toFixed(1));
                break;
        }
    }
}

/**
 * Готовит и масштабирует данные корабля на основе разрешения экрана клиента.
 * Эта функция напрямую модифицирует объект playerShip.
 * @param {object} playerShip - Необработанные данные корабля игрока из базы данных.
 * @param {number} startWidth - Ширина экрана клиента.
 * @param {number} startHeight - Высота экрана клиента.
 * @returns {{preparedShip: object, speedScaleFactor: number, sizeScaleFactor: number, calculatedHitboxRadius: number}} - Полностью готовый корабль и факторы масштабирования.
 */
function prepareShipData(playerShip, startWidth, startHeight) {
    const speedScaleFactor = startWidth / REFERENCE_WIDTH;
    const sizeScaleFactor = startHeight / REFERENCE_HEIGHT;

    playerShip.modules.engine.module.params.speed = Math.round(playerShip.modules.engine.module.params.speed * speedScaleFactor);

    applyShipBonuses(playerShip);

    const shipStaticConfig = SHIP_CONFIGS[playerShip.type];
    const calculatedShipSize = {
        width: Math.round(shipStaticConfig.textureSize.width * shipStaticConfig.scale * sizeScaleFactor),
        height: Math.round(shipStaticConfig.textureSize.height * shipStaticConfig.scale * sizeScaleFactor)
    };
    const calculatedHitboxRadius = Math.round(Math.min(calculatedShipSize.width, calculatedShipSize.height) / 2);
    playerShip.shipSize = calculatedShipSize;

    for (const slotName of ['weapon1', 'weapon2']) {
        const weaponSlot = playerShip.modules.weapons[slotName];
        if (weaponSlot && weaponSlot.module && weaponSlot.module.key) {
            const weaponKey = weaponSlot.module.key;
            const mechanics = getWeaponMechanics(weaponKey);

            const modifiedParams = weaponSlot.module.params;

            if (mechanics.bullet) {
                if (mechanics.bullet.speed) {
                    mechanics.bullet.speed = Math.round(mechanics.bullet.speed * speedScaleFactor);
                }
                if (mechanics.bullet.size) {
                    mechanics.bullet.size.width = Math.round(mechanics.bullet.size.width * sizeScaleFactor);
                    mechanics.bullet.size.height = Math.round(mechanics.bullet.size.height * sizeScaleFactor);
                }
            }

            weaponSlot.module.params = {
                ...modifiedParams,
                firePattern: mechanics.firePattern,
                firePatternParams: mechanics.firePatternParams,
                bullet: mechanics.bullet
            };
        }
    }

    return {preparedShip: playerShip, speedScaleFactor, sizeScaleFactor, calculatedHitboxRadius};
}

module.exports = {prepareShipData};
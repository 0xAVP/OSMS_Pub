const logger = require('./logger');

let weaponMechanicsCatalog = null;

let weaponMechanicsCache = null;

/**
 * Сохраняет каталог и ПРЕДВАРИТЕЛЬНО СОЗДАЕТ кэш.
 * @param {object} mechanicsData - Объект с механиками.
 */
function setWeaponMechanics(mechanicsData) {
    weaponMechanicsCatalog = mechanicsData;

    weaponMechanicsCache = {};
    for (const key in mechanicsData) {

        weaponMechanicsCache[key] = mechanicsData[key];
    }

    logger.info('[WeaponMechanicsStore] Weapon mechanics catalog received and cache has been built.');
}

/**
 * Получает ГЛУБОКУЮ КОПИЮ механики.
 * @param {string} weaponKey - Ключ оружия.
 * @returns {object} - Независимый объект с механикой или дефолтный объект.
 */
function getWeaponMechanics(weaponKey) {
    if (!weaponMechanicsCache) {
        logger.error("[WEAPONMECHNICSSTORE] CRITICAL: Weapon mechanics cache not built yet!");
        return {firePattern: 'single', bullet: {type: "bullet3", speed: 800, size: {width: 15, height: 15}}};
    }

    const cachedMechanics = weaponMechanicsCache[weaponKey];

    if (cachedMechanics) {
        return JSON.parse(JSON.stringify(cachedMechanics));
    }

    return {
        firePattern: 'single',
        bullet: JSON.parse(JSON.stringify(weaponMechanicsCache.rookie_cannon.bullet))
    };
}

module.exports = {setWeaponMechanics, getWeaponMechanics};
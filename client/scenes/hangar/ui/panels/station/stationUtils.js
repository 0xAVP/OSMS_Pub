import {getCatalogData} from "../../../wallet/catalog";

export const getModuleByType = (scene, type) => {
    if (!scene.selectedShip?.modules) return null;
    const modulePaths = {
        weapon1: scene.selectedShip.modules.weapons?.weapon1?.module,
        weapon2: scene.selectedShip.modules.weapons?.weapon2?.module,
        shield: scene.selectedShip.modules.shield?.module,
        armor: scene.selectedShip.modules.armor?.module,
        engine: scene.selectedShip.modules.engine?.module,
        extra1: scene.selectedShip.modules.extra?.extra1?.module,
        extra2: scene.selectedShip.modules.extra?.extra2?.module
    };
    const module = modulePaths[type] || null;
    if (!module || !module.key) return null;
    const catalogData = getCatalogData(scene, module.key, "modules") || {};
    return {...module, ...catalogData};
};

export const MODULE_CONFIG = {
    weapon1: {name: 'Weapon 1', defaultTexture: 'default_weapon', type: 'weapon'},
    weapon2: {name: 'Weapon 2', defaultTexture: 'default_weapon', type: 'weapon'},
    shield: {name: 'Shield', defaultTexture: 'default_shield', type: 'shield'},
    armor: {name: 'Armor', defaultTexture: 'default_armor', type: 'armor'},
    engine: {name: 'Engine', defaultTexture: 'default_engine', type: 'engine'},
    extra1: {name: 'Extra 1', defaultTexture: 'default_extra', type: 'extra'},
    extra2: {name: 'Extra 2', defaultTexture: 'default_extra', type: 'extra'}
};

/**
 * Безопасно извлекает slotUid из объекта корабля.
 */
export function getSlotUid(ship, slotKey) {
    if (!ship || !ship.modules) return null;
    const {modules} = ship;
    switch (slotKey) {
        case 'weapon1':
            return modules.weapons?.weapon1?.slotUid || null;
        case 'weapon2':
            return modules.weapons?.weapon2?.slotUid || null;
        case 'shield':
            return modules.shield?.slotUid || null;
        case 'armor':
            return modules.armor?.slotUid || null;
        case 'engine':
            return modules.engine?.slotUid || null;
        case 'extra1':
            return modules.extra?.extra1?.slotUid || null;
        case 'extra2':
            return modules.extra?.extra2?.slotUid || null;
        default:
            return null;
    }
}

/**
 * Возвращает отображаемое имя для слота из MODULE_CONFIG.
 */
export function getSlotDisplayName(slotKey) {
    return MODULE_CONFIG[slotKey]?.name || 'Unknown Slot';
}

/**
 * Возвращает ключ текстуры по умолчанию для пустого слота из MODULE_CONFIG.
 */
export function getDefaultIconForSlot(slotKey) {
    return MODULE_CONFIG[slotKey]?.defaultTexture || 'default_module';
}

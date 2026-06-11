/**
 * @file Единственный источник правды об определениях всех баффов.
 */


const staticBuffs = {
    /*
    "exp_booster_x2": { ... }
    */
};

const TIME_PORTAL_BUFF_TEMPLATE = {
    name: "Time Portal",
    group: "time_portal",
    groupName: "Portals",
    durationMs: 604800000,
    isStackable: false,
    texture: 'stagestone_texture'
};

const TIME_PORTAL_BUFF_PREFIX = 'timePortal_buff_tier_';

/**
 * Собирает и возвращает ПОЛНЫЙ каталог определений баффов для отправки клиенту.
 * @returns {object}
 */
function getFullBuffCatalogForClient() {

    const catalogForClient = {

        ...staticBuffs,

        templates: {
            'time_portal': TIME_PORTAL_BUFF_TEMPLATE

        }
    };

    return catalogForClient;
}

/**
 * Получает определение (definition) для конкретного баффа.
 * Используется ВНУТРИ сервера.
 */
function getBuffDefinition(buffId) {
    if (staticBuffs[buffId]) {
        return {buffId, ...staticBuffs[buffId]};
    }

    if (buffId && buffId.startsWith(TIME_PORTAL_BUFF_PREFIX)) {
        const tierString = buffId.replace(TIME_PORTAL_BUFF_PREFIX, '');
        const tier = parseInt(tierString, 10);

        if (!isNaN(tier) && tier > 0) {
            const unlockedStage = (tier - 1) * 5 + 5;
            return {
                buffId: buffId,
                ...TIME_PORTAL_BUFF_TEMPLATE,
                effects: {
                    unlocksStage: unlockedStage
                }
            };
        }
    }

    return null;
}

module.exports = {
    getBuffDefinition,
    getFullBuffCatalogForClient
};
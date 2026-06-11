const {ENEMIES} = require('../../objects/enemies/enemies');
const {BOSSES} = require('../../objects/enemies/bosses');
const lootIdManager = require('../../objects/loot/lootIdManager');
const logger = require("../../core/logger");
const clone = require('rfdc')();
const {default_loot_table} = require('../states/configs/stageConfig');

const roll = (chance) => Math.random() < chance;

/**
 * Выбирает N случайных предметов из пула на основе их весов.
 * @param {Array} pool - Пул предметов, каждый с полем 'weight'.
 * @param {number} count - Количество предметов для выбора.
 * @returns {Array} - Массив из 'count' выбранных предметов.
 */
function pickWeightedItems(pool, count) {
    if (!pool || pool.length === 0 || count <= 0) {
        return [];
    }

    const chosenItems = [];
    let tempPool = [...pool];
    const numToPick = Math.min(count, tempPool.length);

    for (let i = 0; i < numToPick; i++) {
        const totalWeight = tempPool.reduce((sum, item) => sum + (item.weight || 1), 0);
        if (totalWeight <= 0) break;

        let randomRoll = Math.random() * totalWeight;

        for (let j = 0; j < tempPool.length; j++) {
            const item = tempPool[j];
            randomRoll -= (item.weight || 1);
            if (randomRoll <= 0) {
                chosenItems.push(item);
                tempPool.splice(j, 1);
                break;
            }
        }
    }
    return chosenItems;
}

/**
 * Универсальная функция, обрабатывающая как гарантированные, так и шансовые дропы из таблицы лута.
 * @param {object} lootTable - Финальная, объединенная таблица лута для обработки.
 * @param {object} session - Игровая сессия.
 * @returns {Array<[number, number]>}
 */
function processLootTable(lootTable, session) {
    const finalLoot = [];
    if (!lootTable) return finalLoot;

    for (const category in lootTable) {
        const lootGroup = lootTable[category];
        const generatedItems = new Set();

        if (lootGroup.guaranteedDrops > 0 && lootGroup.pool) {
            const guaranteedItems = pickWeightedItems(lootGroup.pool, lootGroup.guaranteedDrops);

            for (const item of guaranteedItems) {
                const amount = Math.floor(Math.random() * ((item.maxAmount || 1) - (item.minAmount || 1) + 1)) + (item.minAmount || 1);
                const itemId = lootIdManager.getId(item.type);

                if (itemId) {
                    if (!session.loot[category]) session.loot[category] = {};
                    session.loot[category][item.type] = (session.loot[category][item.type] || 0) + amount;
                    finalLoot.push([itemId, amount]);
                    generatedItems.add(item.type);
                }
            }
        }

        if (lootGroup.pool && Array.isArray(lootGroup.pool)) {
            for (const item of lootGroup.pool) {
                if (generatedItems.has(item.type)) {
                    continue;
                }

                if (item.chance !== undefined && roll(item.chance)) {
                    const amount = Math.floor(Math.random() * ((item.maxAmount || 1) - (item.minAmount || 1) + 1)) + (item.minAmount || 1);
                    const itemId = lootIdManager.getId(item.type);

                    if (itemId) {
                        if (!session.loot[category]) session.loot[category] = {};
                        session.loot[category][item.type] = (session.loot[category][item.type] || 0) + amount;
                        finalLoot.push([itemId, amount]);
                    } else {
                        logger.warn(`[LootManagerV2] Unknown loot item ID for type: ${item.type}`);
                    }
                }
            }
        }
    }
    return finalLoot;
}

/**
 * ГЛАВНАЯ ФУНКЦИЯ-ДИСПЕТЧЕР
 * @param {object} session
 * @param {number} destroyedEntityId
 * @param {string} reason - 'killed' или 'mined'
 * @returns {Array<[number, number]>}
 */
function generateLoot(session, destroyedEntityId, reason) {
    const cm = session.componentManager;
    const render = cm.getComponent(destroyedEntityId, 'render');
    if (!render) return [];

    const enemyConfig = ENEMIES[render.typeId] || BOSSES[render.typeId];
    if (!enemyConfig) return [];

    let finalLootTable;

    if (reason === 'mined') {
        finalLootTable = enemyConfig.loot || {};
    } else {
        const lootBehavior = enemyConfig.lootBehavior || 'use_stage_pool';
        const stageLootTable = session.currentStage?.loot || default_loot_table;

        switch (lootBehavior) {
            case 'use_stage_pool':
                finalLootTable = stageLootTable;
                break;
            case 'exclusive_pool':
                finalLootTable = enemyConfig.loot || {};
                break;
            case 'augment_stage_pool':
                finalLootTable = clone(stageLootTable);
                const entityLootTable = enemyConfig.loot || {};
                for (const category in entityLootTable) {
                    if (!finalLootTable[category]) finalLootTable[category] = {};

                    if (entityLootTable[category].pool) {
                        if (!finalLootTable[category].pool) finalLootTable[category].pool = [];
                        finalLootTable[category].pool.push(...entityLootTable[category].pool);
                    }

                    if (entityLootTable[category].guaranteedDrops) {
                        finalLootTable[category].guaranteedDrops = (finalLootTable[category].guaranteedDrops || 0) + entityLootTable[category].guaranteedDrops;
                    }
                }
                break;
            default:
                finalLootTable = stageLootTable;
        }
    }

    let finalLoot = processLootTable(finalLootTable, session);

    const isBoss = !!BOSSES[render.typeId];
    if (isBoss && reason === 'killed') {
        const stageLevel = session.currentStageNumber || 1;
        const stagestoneTier = Math.floor((stageLevel - 5) / 5) + 1;

        if (stagestoneTier > 0) {
            const stagestoneKey = `stagestone_tier_${stagestoneTier}`;
            const itemId = lootIdManager.getId(stagestoneKey);
            if (itemId) {
                let amount = 1;
                if (roll(0.5)) amount += 1;
                if (!session.loot.stagestones) session.loot.stagestones = {};
                session.loot.stagestones[stagestoneKey] = (session.loot.stagestones[stagestoneKey] || 0) + amount;
                finalLoot.push([itemId, amount]);
            }
        }
    }

    return finalLoot;
}

module.exports = {generateLoot};
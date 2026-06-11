const logger = require("../../../core/logger");

class StatRecalculationSystem {
    constructor() {
        logger.info('[ECS:StatRecalculationSystem] Initialized.');
    }

    /**
     * Находит все сущности, помеченные как "грязные", и пересчитывает для них кэш статов.
     * @param {object} session - Игровая сессия.
     */
    process(session) {
        const cm = session.componentManager;
        const dirtyEntitiesStore = cm.componentStores.get('stats_dirty');

        if (!dirtyEntitiesStore || dirtyEntitiesStore.size === 0) {
            return;
        }

        const entitiesToProcess = Array.from(dirtyEntitiesStore.keys());

        for (const entityId of entitiesToProcess) {
            this.recalculateAllStatsForEntity(entityId, session);

            cm.removeComponent(entityId, 'stats_dirty');
        }
    }

    /**
     * Выполняет полный пересчет всех модифицируемых статов для одной сущности.
     * @param {number} entityId - ID сущности для пересчета.
     * @param {object} session - Игровая сессия.
     */
    recalculateAllStatsForEntity(entityId, session) {
        const cm = session.componentManager;
        const cachedStats = cm.getComponent(entityId, 'cached_stats');
        if (!cachedStats) return;

        const health = cm.getComponent(entityId, 'health');
        const energy = cm.getComponent(entityId, 'energy');
        const armorStats = cm.getComponent(entityId, 'armor_stats');
        const engineStats = cm.getComponent(entityId, 'engine_stats');
        const inventory = cm.getComponent(entityId, 'weapon_inventory');

        const activeBuffs = cm.getComponent(entityId, 'active_buffs');

        let baseCritChance = 0;
        let baseCritModifier = 0;
        if (inventory) {
            const weapon = inventory.weapons[inventory.activeSlot];
            if (weapon?.params?.critical) {
                baseCritChance = weapon.params.critical.chance || 0;
                baseCritModifier = weapon.params.critical.modifier || 0;
            }
        }
        cachedStats.critChance = this.applyModifiers(baseCritChance, 'critChance', activeBuffs);
        cachedStats.critModifier = this.applyModifiers(baseCritModifier, 'critModifier', activeBuffs);
        cachedStats.damageMultiplier = this.applyModifiers(1.0, 'damageMultiplier', activeBuffs);

        const baseMaxShield = health ? health.maxShield : 0;
        const baseShieldRegen = health ? health.shieldRegen : 0;
        const newMaxShield = this.applyModifiers(baseMaxShield, 'maxShield', activeBuffs);

        if (health && newMaxShield < health.shield) {
            health.shield = newMaxShield;
        }
        cachedStats.maxShield = newMaxShield;
        cachedStats.shieldRegen = this.applyModifiers(baseShieldRegen, 'shieldRegen', activeBuffs);

        const baseAbsorbChance = armorStats?.absorption?.chance || 0;
        const baseAbsorbAmount = armorStats?.absorption?.absorb || 0;
        cachedStats.armorAbsorptionChance = this.applyModifiers(baseAbsorbChance, 'armorAbsorptionChance', activeBuffs);
        cachedStats.armorAbsorptionAmount = this.applyModifiers(baseAbsorbAmount, 'armorAbsorptionAmount', activeBuffs);

        const baseEnergyRegen = energy ? energy.regen : 0;
        const baseEvasion = engineStats ? engineStats.evasion : 0;
        cachedStats.energyRegen = this.applyModifiers(baseEnergyRegen, 'energyRegen', activeBuffs);
        cachedStats.evasion = this.applyModifiers(baseEvasion, 'evasion', activeBuffs);
    }

    /**
     * Вспомогательная чистая функция для применения всех модификаторов к базовому значению.
     */
    applyModifiers(baseValue, statName, activeBuffs) {
        if (!activeBuffs || activeBuffs.size === 0) {
            return baseValue;
        }

        let flatBonus = 0;
        let multiplier = 1.0;

        for (const buff of activeBuffs.values()) {
            if (buff.effect.targetStat === statName) {
                const mod = buff.effect.modification;
                if (mod.type === 'flat') {
                    flatBonus += mod.value;
                } else if (mod.type === 'multiplier') {
                    multiplier += mod.value;
                }
            }
        }
        return (baseValue + flatBonus) * multiplier;
    }
}

module.exports = new StatRecalculationSystem();
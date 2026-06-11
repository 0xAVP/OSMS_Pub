/**
 * @file Единственный источник правды о всех возможных бонусах кораблей.
 * Object.freeze() используется для предотвращения случайных изменений этого объекта в других частях кода.
 */

const BONUS_DICTIONARY = Object.freeze({

    damageBonusPercent: {
        description: "Увеличивает базовый урон всех орудийных модулей.",
        type: 'Combat'
    },
    critChanceBonusPercent: {
        description: "Увеличивает шанс критического удара.",
        type: 'Combat'
    },
    critDamageBonusPercent: {
        description: "Увеличивает множитель критического урона.",
        type: 'Combat'
    },
    shieldCapacityBonusPercent: {
        description: "Увеличивает максимальную ёмкость щита.",
        type: 'Combat'
    },
    shieldRegenBonusPercent: {
        description: "Увеличивает скорость регенерации щита.",
        type: 'Combat'
    },
    shieldDelayStartRegenBonusPercent: {
        description: "Уменьшает задержку перед перезарядкой щита",
        type: 'Combat'
    },
    armorCapacityBonusPercent: {
        description: "Увеличивает прочность брони/корпуса.",
        type: 'Combat'
    },
    armorAbsorptionChanceBonusPercent: {
        description: "Увеличивает шанс поглощения урона броней.",
        type: 'Combat'
    },
    armorAbsorptionAmountBonusPercent: {
        description: "Увеличивает количество поглощенного урона броней.",
        type: 'Combat'
    },
    evasionChanceBonusPercent: {
        description: "Увеличивает шанс уклонения от атаки.",
        type: 'Combat'
    },
    hullAmountBonusPercent: {
        description: "Увеличивает hp корпуса",
        type: 'Combat'
    },

    energyCapacityBonusPercent: {
        description: "Увеличивает максимальный запас энергии.",
        type: 'Utility'
    },
    energyRegenBonusPercent: {
        description: "Увеличивает скорость регенерации энергии.",
        type: 'Utility'
    }
});

const BONUS_NAME_MAP = Object.freeze({
    damageBonusPercent: "Damage Bonus",
    critChanceBonusPercent: "Critical Chance Bonus",
    critDamageBonusPercent: "Critical Damage Bonus",
    shieldCapacityBonusPercent: "Shield Capacity Bonus",
    shieldRegenBonusPercent: "Shield Regen Bonus",
    shieldDelayStartRegenBonusPercent: "Shield Regen Delay Bonus",
    armorCapacityBonusPercent: "Armor Capacity Bonus",
    armorAbsorptionChanceBonusPercent: "Armor Absorption Chance",
    armorAbsorptionAmountBonusPercent: "Armor Absorption Amount",
    evasionChanceBonusPercent: "Evasion Chance Bonus",
    hullAmountBonusPercent: "Hull Bonus",
    energyCapacityBonusPercent: "Energy Capacity Bonus",
    energyRegenBonusPercent: "Energy Regen Bonus"
});

const VALID_BONUS_KEYS = new Set(Object.keys(BONUS_DICTIONARY));

module.exports = {
    BONUS_DICTIONARY,
    VALID_BONUS_KEYS,
    BONUS_NAME_MAP
};
const POWERUP_DATA = {
    'CRIT_CHANCE_BOOST_T1_PWR': {
        typeId: 1,
        size: {width: 60, height: 60},
        durationOnFieldMs: 10000,
        effect: {
            buffId: 'CRIT_CHANCE_BOOST_T1',
            stackable: true,
            durationMs: 10000,
            targetStat: 'critChance',
            modification: {
                type: 'flat',
                value: 80
            }
        }
    },

    'CRIT_MODIFIER_BOOST_T1_PWR': {
        typeId: 2,
        size: {width: 60, height: 60},
        durationOnFieldMs: 10000,
        effect: {
            buffId: 'CRIT_MODIFIER_BOOST_T1',
            stackable: true,
            durationMs: 10000,
            targetStat: 'critModifier',
            modification: {
                type: 'flat',
                value: 200
            }
        }
    },
    'SHIELD_CAPACITY_BOOST_T1_PWR': {
        typeId: 3,
        size: {width: 60, height: 60},
        durationOnFieldMs: 10000,
        effect: {
            buffId: 'SHIELD_CAPACITY_BOOST_T1',
            stackable: false,
            durationMs: 20000,
            targetStat: 'maxShield',
            modification: {
                type: 'multiplier',
                value: 0.90
            }
        }
    },
    'SHIELD_REGEN_BOOST_T1_PWR': {
        typeId: 4,
        size: {width: 60, height: 60},
        durationOnFieldMs: 10000,
        effect: {
            buffId: 'SHIELD_REGEN_BOOST_T1',
            stackable: false,
            durationMs: 15000,
            targetStat: 'shieldRegen',
            modification: {
                type: 'multiplier',
                value: 2.0
            }
        }
    },
    'HULL_REPAIR_T1_PWR': {
        typeId: 5,
        size: {width: 60, height: 60},
        durationOnFieldMs: 10000,
        effect: {
            actionType: 'instant',
            target: 'hull',
            valueType: 'percentage',
            value: 0.20
        }
    },
    'ARMOR_ABSORPTION_CHANCE_BOOST_T1_PWR': {
        typeId: 6,
        size: {width: 60, height: 60},
        durationOnFieldMs: 10000,
        effect: {
            buffId: 'ARMOR_ABSORPTION_CHANCE_BOOST_T1',
            stackable: true,
            durationMs: 10000,
            targetStat: 'armorAbsorptionChance',
            modification: {
                type: 'flat',
                value: 80
            }
        }
    },
    'ARMOR_ABSORPTION_AMOUNT_BOOST_T1_PWR': {
        typeId: 7,
        size: {width: 60, height: 60},
        durationOnFieldMs: 10000,
        effect: {
            buffId: 'ARMOR_ABSORPTION_AMOUNT_BOOST_T1',
            stackable: true,
            durationMs: 10000,
            targetStat: 'armorAbsorptionAmount',
            modification: {
                type: 'multiplier',
                value: 2.0
            }
        }
    },
    'ENERGY_REGEN_BOOST_T1_PWR': {
        typeId: 8,
        size: {width: 60, height: 60},
        durationOnFieldMs: 10000,
        effect: {
            buffId: 'ENERGY_REGEN_BOOST_T1',
            stackable: true,
            durationMs: 10000,
            targetStat: 'energyRegen',
            modification: {
                type: 'multiplier',
                value: 0.5
            }
        }
    },
    'EVASION_CHANCE_BOOST_T1_PWR': {
        typeId: 9,
        size: {width: 60, height: 60},
        durationOnFieldMs: 10000,
        effect: {
            buffId: 'EVASION_CHANCE_BOOST_T1',
            stackable: true,
            durationMs: 10000,
            targetStat: 'evasion',
            modification: {
                type: 'flat',
                value: 80
            }
        }
    },
    'DAMAGE_BOOST_T1_PWR': {
        typeId: 10,
        size: {width: 60, height: 60},
        durationOnFieldMs: 10000,
        effect: {
            buffId: 'DAMAGE_BOOST_T1',
            stackable: true,
            durationMs: 10000,
            targetStat: 'damageMultiplier',
            modification: {
                type: 'multiplier',
                value: 0.9
            }
        }
    }
};

module.exports = {POWERUP_DATA};
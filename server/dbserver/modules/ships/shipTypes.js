const {VALID_BONUS_KEYS} = require('./bonuses');

const SHIP_TYPES = {
    0: {
        name: 'Nebular',
        hullPoints: 100,
        bonuses: {
            shieldCapacityBonusPercent: 10,
            armorCapacityBonusPercent: 10,
            energyCapacityBonusPercent: 10,
        },
    },
    1: {
        name: 'Horizon',
        hullPoints: 100,
        bonuses: {
            damageBonusPercent: 20,
            critDamageBonusPercent: 50
        },
    },
    2: {
        name: 'Guardian',
        hullPoints: 100,
        bonuses: {
            armorCapacityBonusPercent: 20,
            armorAbsorptionAmountBonusPercent: 20,
            hullAmountBonusPercent: 100
        },
    },
    3: {
        name: 'Hypercon',
        hullPoints: 100,
        bonuses: {
            energyRegenBonusPercent: 50,
            evasionChanceBonusPercent: 15,
            critChanceBonusPercent: 15
        },
    },
    4: {
        name: 'Cerberus',
        hullPoints: 100,
        bonuses: {
            shieldCapacityBonusPercent: 20,
            armorCapacityBonusPercent: 20,
            energyRegenBonusPercent: 10
        },
    },
    5: {
        name: 'Scopus',
        hullPoints: 100,
        bonuses: {
            damageBonusPercent: 10,
            evasionChanceBonusPercent: 10,
            shieldDelayStartRegenBonusPercent: 20
        },
    },
    6: {
        name: 'Leviathan',
        hullPoints: 100,
        bonuses: {
            hullAmountBonusPercent: 10,
            shieldRegenBonusPercent: 20,
            shieldDelayStartRegenBonusPercent: 20
        },
    },
    7: {
        name: "Celestial",
        hullPoints: 100,
        isCraftable: true,
        bonuses: {
            shieldCapacityBonusPercent: [10, 20],
            armorCapacityBonusPercent: [10, 20],
            energyCapacityBonusPercent: [10, 20]
        },
        craftingRequirements: {
            hull_celestial: {
                "category": "hulls",
                "quantity": 1
            },
            fuel: {
                "category": "other",
                "quantity": 2500
            },
        }
    }
};

function validateShipTypes() {
    for (const shipId in SHIP_TYPES) {
        const ship = SHIP_TYPES[shipId];
        if (ship.bonuses) {
            for (const bonusKey in ship.bonuses) {
                if (!VALID_BONUS_KEYS.has(bonusKey)) {
                    throw new Error(`[ShipTypes Config Error] Invalid bonus key "${bonusKey}" for ship "${ship.name}" (ID: ${shipId}).`);
                }
            }
        }
    }
}

validateShipTypes();

module.exports = SHIP_TYPES;
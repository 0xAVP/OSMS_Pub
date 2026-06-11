export const RARITY_COLORS = {
    default: 0xe0e0e0,
    rookie: 0x758BA0,
    common: 0x758BA0,
    uncommon: 0x42DA9D,
    rare: 0x41C6FF,
    epic: 0xC029E5,
    legendary: 0xFEBA00
};

export const paramLabelsByType = {
    weapon: {
        'damage.min': 'Min Damage',
        'damage.max': 'Max Damage',
        fireRate: 'Fire Rate',
        energyCost: 'Energy Cost',
        'critical.chance': 'Critical Chance',
        'critical.modifier': 'Critical Mod',
        'bullet.speed': 'Bullet Speed'
    },
    shield: {
        'shield.capacity': 'Shield Capacity',
        'shield.regen': 'Shield Regen',
        'shield.delay': 'Delay (ms)',
    },
    armor: {
        'armor.capacity': 'Armor Capacity',
        'absorption.chance': 'Absorption Chance',
        'absorption.absorb': 'Absorption'
    },
    engine: {
        speed: 'Speed',
        'energy.capacity': 'Energy Capacity',
        'energy.regen': 'Energy Regen',
        evasion: 'Evasion'
    },
    extra: {
        bonusEffect: 'Bonus Effect',
        energyCost: 'Energy Cost'
    }
};
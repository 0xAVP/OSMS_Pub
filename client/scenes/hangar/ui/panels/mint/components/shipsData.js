/**
 * @file Contains display data for ships in the UI (lobby, hangar, etc.).
 * This information includes classes, rarity, descriptions, and bonuses in a human-readable format.
 */

export const SHIP_LORE_DATA = {
    'Nebular': {
        class: 'Frigate',
        rarity: 'Common',
        description: 'A reliable workhorse of any fleet. The Nebular boasts balanced defensive systems and a robust power core, making it a versatile ship for pilots just beginning their journey in space.',
        hull: 100,
        bonuses: [
            "+10% Shield Capacity",
            "+10% Armor Capacity",
            "+10% Energy Capacity"
        ],
    },
    'Horizon': {
        class: 'Destroyer',
        rarity: 'Common',
        description: 'Engineered for aggressive "hit-and-run" tactics, the Horizon specializes in dealing colossal damage. Its bonuses are focused on enhancing critical strikes, allowing it to neutralize targets with a single, precise volley.',
        hull: 100,
        bonuses: [
            "+20% Damage",
            "+50% Critical Damage"
        ]
    },
    'Guardian': {
        class: 'Cruiser',
        rarity: 'Common',
        description: 'A true bastion of the fleet. The Guardian is a mobile fortress, capable of withstanding heavy fire thanks to its reinforced armor and a unique ability to absorb a significant portion of incoming damage.',
        hull: 100,
        bonuses: [
            "+100% Hull Integrity",
            "+20% Armor Capacity",
            "+20% Armor Damage Absorption"
        ]
    },
    'Hypercon': {
        class: 'Interceptor',
        rarity: 'Common',
        description: 'Incredibly agile and elusive, the Hypercon is a master of maneuver warfare. Its systems are tuned for evading attacks and maintaining a high rate of fire through rapid energy regeneration.',
        hull: 100,
        bonuses: [
            "+50% Energy Regeneration",
            "+15% Evasion Chance",
            "+15% Critical Chance"
        ]
    },
    'Cerberus': {
        class: 'Battlecruiser',
        rarity: 'Common',
        description: 'A powerful and resilient battlecruiser, the Cerberus is built for prolonged engagements. Its enhanced shields, armor, and improved energy regeneration allow it to outlast any opponent on the battlefield.',
        hull: 100,
        bonuses: [
            "+20% Shield Capacity",
            "+20% Armor Capacity",
            "+10% Energy Regeneration"
        ]
    },
    'Scopus': {
        class: 'Tactical Cruiser',
        rarity: 'Common',
        description: 'A specialized vessel for tactical superiority. The Scopus combines increased firepower with unique shield modifications that allow it to recover more quickly after taking damage.',
        hull: 100,
        bonuses: [
            "+10% Damage",
            "+10% Evasion Chance",
            "-20% Shield Recharge Delay"
        ]
    },
    'Leviathan': {
        class: 'Battleship',
        rarity: 'Common',
        description: 'An awe-inspiring flagship. The Leviathan is an impenetrable colossus whose systems are focused on survivability. Its reinforced hull and advanced shield regeneration technologies make it nearly indestructible.',
        hull: 100,
        bonuses: [
            "+200% Hull Integrity",
            "+20% Shield Regeneration",
            "-20% Shield Recharge Delay"
        ]
    },
    'Celestial': {
        class: 'Experimental Frigate',
        rarity: 'Uncommon',
        description: 'An engineering masterpiece built from blueprints. Each Celestial vessel is unique, thanks to an experimental bonus matrix that generates random enhancements upon construction.',
        hull: 100,
        bonuses: [
            "Random: +10-20% Shield Capacity",
            "Random: +10-20% Armor Capacity",
            "Random: +10-20% Energy Capacity"
        ],
        craftingRequirements: {
            "hull_celestial": {"category": "hulls", "quantity": 1},
            "fuel": {"category": "other", "quantity": 2500}
        }
    },
    'default': {
        class: 'Unknown Vessel',
        rarity: 'default',
        description: 'No classification data available for this ship type.',
        hull: 100,
        bonuses: ["No unique bonuses"]
    }
};
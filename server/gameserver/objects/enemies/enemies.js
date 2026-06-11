const {WEAPONS} = require('./weapons/weapons');
const {buildEnemies} = require('./_builder');
const {
    ARCHETYPE_GRUNT_LINEAR,
    ARCHETYPE_SKIRMISHER_ZIGZAG,
    ARCHETYPE_KAMIKAZE,
    ARCHETYPE_STRAFER,
    ARCHETYPE_DART_SPLINE,
    ARCHETYPE_UNIQUE, ARCHETYPE_TURRET, ARCHETYPE_ASSAULT_GRUNT,
    ARCHETYPE_JUGGERNAUT_GRUNT, ARCHETYPE_BEAM_TURRET, ARCHETYPE_MINELAYER, ARCHETYPE_SUMMONER,
    ARCHETYPE_TACTICAL_SUMMONER
} = require('./_archetypes');
const {MINIONS} = require("./minions");

const enemyDefinitions = {

    1: {
        archetype: ARCHETYPE_GRUNT_LINEAR,
        name: 'Light Grunt',
        texture: {
            size: {width: 256, height: 256},
            scale: 0.3
        },
        weapons: [
            {weapon: WEAPONS.singleWeapon, weight: 1}
        ]
    },
    2: {
        archetype: ARCHETYPE_GRUNT_LINEAR,
        name: 'Mid Grunt',
        texture: {
            size: {width: 256, height: 256},
            scale: 0.3
        },
        weapons: [
            {weapon: WEAPONS.singleTargetedWeapon, weight: 1}
        ]
    },
    3: {
        archetype: ARCHETYPE_GRUNT_LINEAR,
        name: 'High Grunt',
        texture: {
            size: {width: 256, height: 256},
            scale: 0.3
        },
        weapons: [
            {weapon: WEAPONS.burstWeapon, weight: 1}
        ]
    },
    4: {
        archetype: ARCHETYPE_SKIRMISHER_ZIGZAG,
        name: 'Light Scout',
        texture: {
            size: {width: 256, height: 256},
            scale: 0.3
        },
        weapons: [{weapon: WEAPONS.singleTargetedWeapon, weight: 1}]
    },
    5: {
        archetype: ARCHETYPE_SKIRMISHER_ZIGZAG,
        name: 'Mid Scout',
        texture: {
            size: {width: 256, height: 256},
            scale: 0.3
        },
        weapons: [{weapon: WEAPONS.round6Weapon, weight: 1}]
    },
    6: {
        archetype: ARCHETYPE_SKIRMISHER_ZIGZAG,
        name: 'High Scout',
        texture: {
            size: {width: 256, height: 256},
            scale: 0.3
        },
        weapons: [{weapon: WEAPONS.singleWeapon, weight: 1}]
    },

    7: {
        archetype: ARCHETYPE_STRAFER,
        name: 'Sniper Strafer',
        texture: {
            size: {width: 256, height: 256},
            scale: 0.3
        },
        weapons: [
            {weapon: WEAPONS.sniperBurstWeapon, weight: 1}
        ],
    },
    8: {
        archetype: ARCHETYPE_DART_SPLINE,
        name: 'Dart',
        texture: {
            size: {width: 256, height: 256},
            scale: 0.3
        },
        weapons: [

            {weapon: WEAPONS.burstWeapon, weight: 1}
        ]
    },
    9: {
        archetype: ARCHETYPE_ASSAULT_GRUNT,
        name: 'Light Assault Grunt',
        texture: {
            size: {width: 256, height: 256},
            scale: 0.3
        },
        weapons: [
            {weapon: WEAPONS.assaultWeapon, weight: 1}
        ]
    },
    10: {
        archetype: ARCHETYPE_ASSAULT_GRUNT,
        name: 'Light Assault Grunt',
        texture: {
            size: {width: 256, height: 256},
            scale: 0.3
        },
        weapons: [
            {weapon: WEAPONS.burstWeapon, weight: 1}
        ]
    },
    11: {
        archetype: ARCHETYPE_ASSAULT_GRUNT,
        name: 'Light Assault Grunt',
        texture: {
            size: {width: 256, height: 256},
            scale: 0.3
        },
        weapons: [
            {weapon: WEAPONS.spreadWeapon, weight: 1}
        ]
    },
    12: {
        archetype: ARCHETYPE_JUGGERNAUT_GRUNT,
        name: 'Jugger Grunt',
        texture: {
            size: {width: 256, height: 256},
            scale: 0.3
        },
        weapons: [
            {weapon: WEAPONS.marksmanWeapon, weight: 0},
            {weapon: WEAPONS.assaultWeapon, weight: 0}
        ]
    },
    13: {
        archetype: ARCHETYPE_MINELAYER,
        name: 'Simple Minelayer',
        texture: {
            size: {width: 256, height: 256},
            scale: 0.3
        }
    },
    14: {
        archetype: ARCHETYPE_SUMMONER,
        name: 'Simple Summoner',
        texture: {
            size: {width: 230, height: 256},
            scale: 0.3
        },
    },
    15: {
        archetype: ARCHETYPE_TACTICAL_SUMMONER,
        name: 'Simple Tactic Summoner',
        texture: {
            size: {width: 256, height: 256},
            scale: 0.3
        },
    },
    16: {
        archetype: ARCHETYPE_KAMIKAZE,
        name: 'Interceptor',
        texture: {
            size: {width: 256, height: 182},
            scale: 0.3
        }
    },
    43: {
        archetype: ARCHETYPE_TURRET,
        name: 'Static Turret',
        texture: {
            size: {width: 297, height: 256},
            scale: 0.3
        },
        weapons: [
            {weapon: WEAPONS.turretWeapon, weight: 1}
        ]
    },
    44: {
        archetype: ARCHETYPE_BEAM_TURRET,
        name: 'Beam Sentry',
        texture: {
            size: {width: 292, height: 256},
            scale: 0.3
        },
        weapons: [
            {weapon: WEAPONS.beamTurretWeapon, weight: 1}
        ]
    },

    101: {
        archetype: ARCHETYPE_UNIQUE,
        name: 'meteorite',
        spawnPattern: 'top_right_random',
        speed: 80,
        isIndestructible: true,
        hp: Number.MAX_SAFE_INTEGER,
        collisionDamage: Number.MAX_SAFE_INTEGER,
        dealsOneShotDamage: true,
        weapons: null,
        texture: {
            size: {width: 256, height: 256},
            scale: 0.4
        },

        behavior: {
            script: [
                {
                    name: "FallDiagonally",

                    movement: {
                        type: 'linear',
                        target: {
                            angle: 135
                        }

                    }
                }
            ]
        },
        lootBehavior: 'exclusive_pool',
        loot: {
            resources: {
                pool: [
                    {type: 'ferrite_cluster', chance: 0.8, minAmount: 2, maxAmount: 5},
                ]
            }
        }
    }
};
const ENEMIES_BASE = buildEnemies(enemyDefinitions);
const ENEMIES = {...ENEMIES_BASE, ...MINIONS};

module.exports = {ENEMIES};
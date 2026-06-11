const {
    ARCHETYPE_GRUNT_LINEAR,
    ARCHETYPE_KAMIKAZE
} = require('./_archetypes');

const BASE_MINION = {
    isMinion: true,
    lootBehavior: 'exclusive_pool',
    loot: {},
    powerupDropConfig: {},
    onKillEffects: {},
    texture: {
        size: {width: 256, height: 256},
        scale: 0.2
    }
};
const ARCHETYPE_MINION_GRUNT_LINEAR = {
    ...ARCHETYPE_GRUNT_LINEAR,
    ...BASE_MINION,
    name: 'Minion Grunt',
    hp: 10,
    collisionDamage: 10,
    behavior: {
        script: [

            {
                name: "FlyAndShoot",
                duration: 20,
                movement: {
                    type: 'linear',
                    target: {angle: 180}
                },
                combat: {tactic: 'always_fire'},
                nextStateIndex: 1
            },

            {
                name: "Expired",
                onEnter: {

                    action: 'mark_for_destruction',
                    params: {reason: 'expired'}
                }
            }
        ]
    }
};
const ARCHETYPE_MINION_KAMIKAZE = {
    ...ARCHETYPE_KAMIKAZE,
    ...BASE_MINION,
    name: 'Kamikaze Minion',
    hp: 10,
    collisionDamage: 20,
    speed: 300,
    texture: {
        size: {width: 256, height: 182},
        scale: 0.2
    },
    behavior: {
        script: [

            {
                name: "ChasePlayerRelentlessly",
                duration: 20,
                movement: {
                    type: 'seek',
                    target: {type: 'player'}
                },
                nextStateIndex: 1
            },

            {
                name: "BurnOut",
                onEnter: {
                    action: 'mark_for_destruction',
                    params: {reason: 'expired'}
                }
            }
        ]
    }
};
const ARCHETYPE_MINION_DEBRIS = {
    ...BASE_MINION,
    name: 'dead_body',
    speed: 15,
    hp: 10,
    collisionDamage: 0,
    weapons: null,
    texture: {
        size: {width: 200, height: 200},
        scale: 0.3
    },
    lootBehavior: 'exclusive_pool',
    loot: {
        resources: {
            guaranteedDrops: 1,
            pool: [

                {type: 'biomass_core', weight: 1, minAmount: 1, maxAmount: 3}
            ]
        }
    },
    behavior: {
        script: [

            {
                name: "DriftingFadeOut",
                duration: 10,
                movement: {
                    type: 'linear',
                    target: {angle: 180}
                },
                nextStateIndex: 1
            },

            {
                name: "SelfDestruct",
                onEnter: {
                    action: 'mark_for_destruction',
                    params: {reason: 'expired'}
                }
            }
        ]
    }
};
const ARCHETYPE_MINION_MINE = {
    ...BASE_MINION,
    name: 'Proximity Mine',
    speed: 10,
    hp: 10,
    collisionDamage: 200,
    weapons: null,
    texture: {
        size: {width: 128, height: 128},
        scale: 0.35
    },
    onKillEffects: {},
    behavior: {
        script: [
            {
                name: "DriftingAndArmed",
                duration: 10,
                movement: {
                    type: 'linear',
                    target: {angle: 180}
                },
                nextStateIndex: 1
            },

            {
                name: "SelfDestruct",

                onEnter: {

                    action: 'mark_for_destruction',
                    params: {reason: 'expired'}
                }
            }
        ]
    }
};
module.exports = {
    ARCHETYPE_MINION_GRUNT_LINEAR,
    ARCHETYPE_MINION_KAMIKAZE,
    ARCHETYPE_MINION_MINE,
    ARCHETYPE_MINION_DEBRIS
};
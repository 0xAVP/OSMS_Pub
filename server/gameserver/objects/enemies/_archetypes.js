const BASE_STANDARD_ENEMY = {
    spawnPattern: 'default',
    texture: {
        size: {width: 256, height: 256},
        scale: 0.3
    },
    lootBehavior: 'use_stage_pool',

    onKillEffects: {
        spawnEntity: {
            chance: 0.01,
            typeId: 10100
        },
        spawnPowerUp: {

            masterChance: 0.1,

            pool: [
                {type: 'SHIELD_REGEN_BOOST_T1_PWR', weight: 10},
                {type: 'SHIELD_CAPACITY_BOOST_T1_PWR', weight: 10},
                {type: 'ARMOR_ABSORPTION_CHANCE_BOOST_T1_PWR', weight: 10},
                {type: 'ARMOR_ABSORPTION_AMOUNT_BOOST_T1_PWR', weight: 10},
                {type: 'HULL_REPAIR_T1_PWR', weight: 5},
                {type: 'CRIT_MODIFIER_BOOST_T1_PWR', weight: 10},
                {type: 'CRIT_CHANCE_BOOST_T1_PWR', weight: 10},
                {type: 'DAMAGE_BOOST_T1_PWR', weight: 10},
                {type: 'EVASION_CHANCE_BOOST_T1_PWR', weight: 10},
                {type: 'ENERGY_REGEN_BOOST_T1_PWR', weight: 10}
            ]
        },
    }
};

const ARCHETYPE_GRUNT_LINEAR = {
    ...BASE_STANDARD_ENEMY,
    name: 'Grunt',
    speed: 100,
    hp: 25,
    collisionDamage: 20,
    behavior: {
        script: [
            {
                name: "FlyForward",
                movement: {
                    type: 'linear',
                    target: {
                        angle: 180
                    }
                },
                combat: {
                    tactic: 'always_fire'
                }
            }
        ]
    },
};
const ARCHETYPE_ASSAULT_GRUNT = {
    ...BASE_STANDARD_ENEMY,
    name: 'Assault Grunt',
    speed: 180,
    hp: 35,
    collisionDamage: 30,
    behavior: {
        script: [

            {
                name: "Approach",
                duration: 5,
                movement: {
                    type: 'seek',
                    target: {type: 'player'}
                },

                triggers: [
                    {condition: 'distance_to_target_less_than', value: 400, newStateIndex: 1}
                ]
            },

            {
                name: "FireBurst",
                duration: 3,
                movement: {
                    type: 'stop'
                },
                combat: {
                    tactic: 'always_fire'
                },
                nextStateIndex: 2
            },

            {
                name: "Reposition",
                duration: 3,
                onEnter: {

                    action: 'generate_random_point_in_zone',
                    params: {
                        zone: {
                            xMinPercent: 0.60, xMaxPercent: 0.90,
                            yMinPercent: 0.10, yMaxPercent: 0.90
                        }
                    }
                },
                movement: {
                    speed: 300,
                    type: 'seek',

                    target: {type: 'point'}
                },
                triggers: [

                    {condition: 'distance_to_target_less_than', value: 30, newStateIndex: 0}
                ],

                nextStateIndex: 0
            }

        ]
    },
};
const ARCHETYPE_JUGGERNAUT_GRUNT = {
    ...BASE_STANDARD_ENEMY,
    name: 'Juggernaut Grunt',
    speed: 70,
    hp: 90,
    collisionDamage: 100,
    behavior: {
        script: [

            {
                name: "DecisionPoint",
                movement: {type: 'stop'},
                triggers: [
                    {condition: 'distance_to_player', less_than: 300, newStateIndex: 3},
                    {condition: 'distance_to_player', less_than: 700, newStateIndex: 2},
                    {condition: 'distance_to_player', greater_than: 699, newStateIndex: 1}
                ]
            },

            {
                name: "LongRangeAttack",
                onEnter: {action: 'switch_weapon', params: {weaponIndex: 0}},
                movement: {type: 'linear', target: {angle: 180}},
                combat: {tactic: 'always_fire'},
                triggers: [
                    {condition: 'distance_to_player', less_than: 700, newStateIndex: 2}
                ]
            },

            {
                name: "MidRangeAttack",
                onEnter: {action: 'switch_weapon', params: {weaponIndex: 1}},
                movement: {type: 'linear', target: {angle: 180}},
                combat: {tactic: 'always_fire'},
                triggers: [
                    {condition: 'distance_to_player', less_than: 300, newStateIndex: 3},
                    {condition: 'distance_to_player', greater_than: 700, newStateIndex: 1}
                ]
            },

            {
                name: "RammingAttack",
                movement: {type: 'seek', target: {type: 'player'}, speed: 400},
                triggers: [
                    {condition: 'distance_to_player', greater_than: 300, newStateIndex: 2}
                ]
            }
        ]
    }
};
const ARCHETYPE_SKIRMISHER_ZIGZAG = {
    ...BASE_STANDARD_ENEMY,
    name: 'Skirmisher',
    speed: 160,
    hp: 15,
    collisionDamage: 25,
    behavior: {
        script: [

            {
                name: "StartFlying",
                duration: 0.05,
                movement: {
                    type: 'linear',
                    target: {angle: 180}
                },
                nextStateIndex: 1
            },

            {
                name: "OscillateFlight",
                movement: {
                    type: 'pingpong',
                    params: {
                        maxVerticalSpeed: 150,
                    }
                },
                combat: {tactic: 'always_fire'}
            }
        ]
    },
};
const ARCHETYPE_KAMIKAZE = {
    ...BASE_STANDARD_ENEMY,
    name: 'Kamikaze',
    speed: 250,
    hp: 20,
    collisionDamage: 50,
    weapons: null,
    behavior: {
        script: [

            {
                name: "ChasePlayer",
                movement: {
                    type: 'seek',
                    target: {type: 'player'}
                },
                triggers: [
                    {condition: 'player_is_behind', newStateIndex: 1}
                ]
            },

            {
                name: "AttackBase",
                movement: {
                    type: 'linear',
                    target: {angle: 180},
                    speed: 350
                }
            }
        ]
    }
};
const ARCHETYPE_STRAFER = {
    ...BASE_STANDARD_ENEMY,
    name: 'Strafer',
    hp: 40,
    collisionDamage: 20,
    behavior: {
        script: [

            {
                name: "ApproachStation",
                duration: 5,
                movement: {
                    type: 'seek',
                    target: {type: 'relative_point', xPercent: 0.83, yPercent: 0.5},
                    speed: 200,
                },
                triggers: [
                    {condition: 'distance_to_target_less_than', value: 50, newStateIndex: 1}
                ]
            },

            {
                name: "StrafeUp",
                duration: 2,
                movement: {
                    type: 'linear',

                    target: {angle: -100},
                    speed: 100
                },
                nextStateIndex: 2
            },

            {
                name: "StopToFireUp",
                duration: 1.5,
                movement: {
                    type: 'linear',
                    target: {angle: 180},
                    speed: 20
                },
                combat: {tactic: 'always_fire'},
                nextStateIndex: 3
            },

            {
                name: "StrafeDown",
                duration: 2,
                movement: {
                    type: 'linear',
                    target: {angle: 100},
                    speed: 100
                },
                nextStateIndex: 4
            },

            {
                name: "StopToFireDown",
                duration: 1.5,
                movement: {
                    type: 'linear',
                    target: {angle: 180},
                    speed: 20
                },
                combat: {tactic: 'always_fire'},
                nextStateIndex: 1
            },
        ]
    },
};
const ARCHETYPE_DART_SPLINE = {
    ...BASE_STANDARD_ENEMY,
    name: 'Dart',
    speed: 300,
    hp: 25,
    collisionDamage: 30,
    behavior: {
        script: [

            {
                name: "GoToTopZone",
                duration: 2,
                onEnter: {
                    action: 'generate_random_point_in_zone',
                    params: {
                        zone: {
                            xMinPercent: 0.75, xMaxPercent: 0.90,
                            yMinPercent: 0.10, yMaxPercent: 0.35
                        }
                    }
                },
                movement: {
                    type: 'seek',
                    target: {type: 'point'}
                },
                triggers: [{condition: 'distance_to_target_less_than', value: 30, newStateIndex: 1}]
            },
            {
                name: "PauseAtTop",
                duration: 0.75,
                movement: {type: 'stop'},
                combat: {tactic: 'always_fire'},
                nextStateIndex: 2
            },

            {
                name: "GoToBottomZone",
                duration: 2,
                onEnter: {
                    action: 'generate_random_point_in_zone',
                    params: {
                        zone: {
                            xMinPercent: 0.70, xMaxPercent: 0.85,
                            yMinPercent: 0.65, yMaxPercent: 0.90
                        }
                    }
                },
                movement: {
                    type: 'seek',
                    target: {type: 'point'}
                },
                triggers: [{condition: 'distance_to_target_less_than', value: 30, newStateIndex: 3}]
            },
            {
                name: "PauseAtBottom",
                duration: 0.75,
                movement: {type: 'stop'},
                combat: {tactic: 'always_fire'},
                nextStateIndex: 4
            },

            {
                name: "GoToMidZone",
                duration: 2,
                onEnter: {
                    action: 'generate_random_point_in_zone',
                    params: {
                        zone: {
                            xMinPercent: 0.80, xMaxPercent: 0.95,
                            yMinPercent: 0.40, yMaxPercent: 0.60
                        }
                    }
                },
                movement: {
                    type: 'seek',
                    target: {type: 'point'}
                },
                triggers: [{condition: 'distance_to_target_less_than', value: 30, newStateIndex: 5}]
            },
            {
                name: "PauseAtMid",
                duration: 0.75,
                movement: {type: 'stop'},
                combat: {tactic: 'always_fire'},
                nextStateIndex: 0
            }
        ]
    },
};
const ARCHETYPE_TURRET = {
    ...BASE_STANDARD_ENEMY,
    spawnPattern: 'side_random',
    name: 'Turret',
    isStatic: true,
    speed: 0,
    hp: 100,
    collisionDamage: 100,
    behavior: {
        script: [

            {
                name: "Initialize",
                duration: 0.01,
                onEnter: {
                    action: 'set_initial_rotation',
                    params: {minAngle: 0, maxAngle: 360}
                },
                nextStateIndex: 1
            },

            {
                name: "RotateAndFire",
                movement: {
                    type: 'rotate',
                    params: {rotationSpeed: 30}
                },
                combat: {tactic: 'always_fire'},
            }
        ]
    }
};
const ARCHETYPE_BEAM_TURRET = {
    ...BASE_STANDARD_ENEMY,
    spawnPattern: 'side_random',
    name: 'Beam Turret',
    isStatic: true,
    speed: 0,
    hp: 120,
    collisionDamage: 100,
    behavior: {
        script: [

            {
                name: "Initialize",
                duration: 0.01,
                onEnter: {
                    action: 'set_initial_rotation',
                    params: {minAngle: 0, maxAngle: 360}
                },
                nextStateIndex: 1
            },

            {
                name: "Scanning",
                movement: {
                    type: 'rotate',
                    params: {rotationSpeed: 45}
                },
                triggers: [
                    {

                        condition: 'player_in_beam',
                        params: {
                            beamWidth: 30,
                            beamRange: 800
                        },
                        newStateIndex: 2
                    }
                ]
            },

            {
                name: "Attacking",
                duration: 5,
                movement: {
                    type: 'track_player',
                    params: {rotationSpeed: 90}
                },
                combat: {tactic: 'always_fire'},
                triggers: [
                    {

                        condition: 'player_outside_beam',
                        params: {
                            beamWidth: 30,
                            beamRange: 800
                        },
                        newStateIndex: 1
                    }
                ],
                nextStateIndex: 1
            }
        ]
    }
};
const ARCHETYPE_MINELAYER = {
    ...BASE_STANDARD_ENEMY,
    name: 'Minelayer',
    weapons: null,
    speed: 150,
    hp: 200,
    collisionDamage: 40,
    behavior: {
        script: [
            {
                name: "GoToRightZone",
                onEnter: {
                    action: 'generate_random_point_in_zone',
                    params: {
                        zone: {
                            xMinPercent: 0.75, xMaxPercent: 0.90,
                            yMinPercent: 0.10, yMaxPercent: 0.90
                        }
                    }
                },
                movement: {type: 'seek', target: {type: 'point'}},
                triggers: [{condition: 'distance_to_target_less_than', value: 30, newStateIndex: 1}]
            },
            {
                name: "DeployMineRight",
                duration: 1,

                onEnter: {
                    action: 'spawn_entity',
                    params: {
                        typeId: 10003
                    }
                },
                movement: {type: 'stop'},
                nextStateIndex: 2
            },
            {
                name: "GoToMidZone",
                onEnter: {
                    action: 'generate_random_point_in_zone',
                    params: {
                        zone: {
                            xMinPercent: 0.50, xMaxPercent: 0.70,
                            yMinPercent: 0.10, yMaxPercent: 0.90
                        }
                    }
                },
                movement: {type: 'seek', target: {type: 'point'}},
                triggers: [{condition: 'distance_to_target_less_than', value: 30, newStateIndex: 3}]
            },
            {
                name: "DeployMineMid",
                duration: 1,
                onEnter: {
                    action: 'spawn_entity',
                    params: {
                        typeId: 10003
                    }
                },
                movement: {type: 'stop'},
                nextStateIndex: 4
            },
            {
                name: "GoToLeftZone",
                onEnter: {
                    action: 'generate_random_point_in_zone',
                    params: {
                        zone: {
                            xMinPercent: 0.25, xMaxPercent: 0.45,
                            yMinPercent: 0.20, yMaxPercent: 0.80
                        }
                    }
                },
                movement: {type: 'seek', target: {type: 'point'}},
                triggers: [{condition: 'distance_to_target_less_than', value: 30, newStateIndex: 5}]
            },
            {
                name: "DeployMineLeft",
                duration: 1,
                onEnter: {
                    action: 'spawn_entity',
                    params: {
                        typeId: 10003
                    }
                },
                movement: {type: 'stop'},
                nextStateIndex: 0
            }
        ]
    }
};
const ARCHETYPE_SUMMONER = {
    ...BASE_STANDARD_ENEMY,
    name: 'Summoner',
    speed: 50,
    hp: 200,
    collisionDamage: 10,
    weapons: null,
    behavior: {
        script: [

            {
                name: "EnterArena",
                duration: 6,
                movement: {
                    type: 'seek',
                    target: {type: 'relative_point', xPercent: 0.9, yPercent: 0.5}
                },
                triggers: [{condition: 'distance_to_target_less_than', value: 20, newStateIndex: 1}]
            },

            {
                name: "SummonMinion",
                duration: 0.5,
                onEnter: {
                    action: 'spawn_entity',
                    params: {
                        typeId: 10001,
                        offsetX: -50,
                        offsetY: 0
                    }
                },
                movement: {type: 'stop'},
                nextStateIndex: 2
            },

            {
                name: "Cooldown",
                duration: 4,
                movement: {type: 'stop'},
                nextStateIndex: 1
            }
        ]
    }
};
const ARCHETYPE_TACTICAL_SUMMONER = {
    ...BASE_STANDARD_ENEMY,
    name: 'Tactical Summoner',
    speed: 80,
    hp: 150,
    collisionDamage: 10,
    weapons: null,
    behavior: {
        script: [

            {
                name: "OccupyRearPosition",
                onEnter: {
                    action: 'generate_random_point_in_zone',
                    params: {
                        zone: {
                            xMinPercent: 0.9, xMaxPercent: 0.95,
                            yMinPercent: 0.1, yMaxPercent: 0.9
                        }
                    }
                },
                movement: {type: 'seek', target: {type: 'point'}},
                triggers: [{condition: 'distance_to_target_less_than', value: 20, newStateIndex: 1}]
            },

            {
                name: "PreLaunchDelay",
                duration: 2.5,
                movement: {type: 'stop'},
                nextStateIndex: 2
            },

            {
                name: "LaunchKamikaze",
                duration: 0.5,
                onEnter: {
                    action: 'spawn_entity',
                    params: {
                        typeId: 10002,
                        offsetX: -50
                    }
                },
                movement: {type: 'stop'},
                nextStateIndex: 0
            }
        ]
    }
};

const ARCHETYPE_UNIQUE = {};

module.exports = {
    ARCHETYPE_GRUNT_LINEAR,
    ARCHETYPE_ASSAULT_GRUNT,
    ARCHETYPE_JUGGERNAUT_GRUNT,
    ARCHETYPE_SKIRMISHER_ZIGZAG,
    ARCHETYPE_KAMIKAZE,
    ARCHETYPE_STRAFER,
    ARCHETYPE_DART_SPLINE,
    ARCHETYPE_TURRET,
    ARCHETYPE_BEAM_TURRET,
    ARCHETYPE_MINELAYER,
    ARCHETYPE_SUMMONER,
    ARCHETYPE_TACTICAL_SUMMONER,
    ARCHETYPE_UNIQUE
};
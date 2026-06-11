const BASE_BOSS = {
    texture: {
        size: {width: 256, height: 256},
        scale: 0.6
    },
    lootBehavior: 'exclusive_pool',
    loot: {
        blueprints: {
            guaranteedDrops: 1,
            pool: [

                {type: 'bp_pulse_blaster_mk1', weight: 10},
                {type: 'bp_pulse_piercer_mk1', weight: 10},
                {type: 'bp_pulse_shotgun_mk1', weight: 100},
                {type: 'bp_energy_shield_mk1', weight: 10},
                {type: 'bp_aegis_shield_mk1', weight: 10},
                {type: 'bp_flux_shield_mk1', weight: 10},
                {type: 'bp_kinetic_armor_mk1', weight: 10},
                {type: 'bp_ablative_armor_mk1', weight: 10},
                {type: 'bp_reactive_armor_mk1', weight: 10},
                {type: 'bp_ion_thruster_mk1', weight: 10}
            ]
        }
    },
    onKillEffects: {
        spawnPowerUp: {
            masterChance: 1,
            pool: [
                {type: 'SHIELD_REGEN_BOOST_T1_PWR', weight: 10},
                {type: 'SHIELD_CAPACITY_BOOST_T1_PWR', weight: 10},
                {type: 'ARMOR_ABSORPTION_CHANCE_BOOST_T1_PWR', weight: 10},
                {type: 'ARMOR_ABSORPTION_AMOUNT_BOOST_T1_PWR', weight: 10},
                {type: 'HULL_REPAIR_T1_PWR', weight: 15},
                {type: 'CRIT_MODIFIER_BOOST_T1_PWR', weight: 10},
                {type: 'CRIT_CHANCE_BOOST_T1_PWR', weight: 15},
                {type: 'DAMAGE_BOOST_T1_PWR', weight: 15},
                {type: 'EVASION_CHANCE_BOOST_T1_PWR', weight: 15},
                {type: 'ENERGY_REGEN_BOOST_T1_PWR', weight: 10}
            ]
        },
    }
};

const ARCHETYPE_CLASSIC_GUARDIAN = {
    ...BASE_BOSS,
    name: 'Classic Guardian',
    speed: 120,
    hp: 500,
    collisionDamage: 200,
    behavior: {
        boundaryBehavior: 'stay_in_bounds',
        script: [

            {
                name: "ApproachStation",
                duration: 3,
                movement: {
                    type: 'seek',
                    target: {type: 'relative_point', xPercent: 0.9, yPercent: 0.5},
                    speed: 200,
                },
                triggers: [{condition: 'distance_to_target_less_than', value: 50, newStateIndex: 1}]
            },

            {
                name: "PreparePhaseOne",
                duration: 0.5,
                onEnter: {

                    action: 'switch_weapon',
                    params: {weaponIndex: 0}
                },
                movement: {type: 'stop'},
                nextStateIndex: 2
            },

            {
                name: "OrbitAndFirePhaseOne",
                duration: 10,
                onEnter: {action: 'set_orbit_center', params: {offsetX: 150}},
                movement: {
                    type: 'orbit',
                    params: {radius: 150, clockwise: true},
                    speed: 100
                },
                combat: {tactic: 'always_fire'},
                nextStateIndex: 3
            },

            {
                name: "PreparePhaseTwo",
                duration: 0.5,
                onEnter: {

                    action: 'switch_weapon',
                    params: {weaponIndex: 1}
                },
                movement: {type: 'stop'},
                nextStateIndex: 4
            },

            {
                name: "SeekAndFirePhaseTwo",
                duration: 3,
                movement: {
                    type: 'seek',
                    target: {type: 'player'},
                    speed: 120
                },
                combat: {tactic: 'always_fire'},
                nextStateIndex: 0
            }

        ]
    },
};
const ARCHETYPE_ANNIHILATOR = {
    ...BASE_BOSS,
    name: 'The Annihilator',
    speed: 100,
    hp: 600,
    collisionDamage: 200,
    behavior: {
        boundaryBehavior: 'stay_in_bounds',
        script: [

            {
                name: "EnterArena",
                duration: 4,
                movement: {
                    type: 'seek',
                    target: {type: 'relative_point', xPercent: 0.5, yPercent: 0.35},
                    speed: 150,
                },
                triggers: [{condition: 'distance_to_target_less_than', value: 20, newStateIndex: 1}]
            },

            {
                name: "PrepPhase1",
                duration: 0.5,
                movement: {type: 'stop'},
                nextStateIndex: 2
            },

            {
                name: "Phase1_AcceleratingSpin",
                duration: 6.57,
                onEnter: {
                    action: 'switch_weapon', params: {weaponIndex: 0}
                },
                movement: {
                    type: 'rotate',
                    params: {

                        rotationSpeed: {start: 20, end: 90}
                    }
                },
                combat: {tactic: 'always_fire'},
                nextStateIndex: 3
            },

            {
                name: "PrepPhase2",
                duration: 0.5,
                onEnter: {action: 'switch_weapon', params: {weaponIndex: 1}},
                movement: {type: 'stop'},
                nextStateIndex: 4
            },
            {
                name: "Phase2_Chase",
                duration: 5,
                movement: {type: 'seek', target: {type: 'player'}, speed: 140},
                combat: {tactic: 'always_fire'},
                nextStateIndex: 5
            },

            {
                name: "PrepPhase3",
                duration: 0.5,
                onEnter: {action: 'switch_weapon', params: {weaponIndex: 2}},
                movement: {type: 'stop'},
                nextStateIndex: 6
            },
            {
                name: "Phase3_Reposition",
                onEnter: {
                    action: 'generate_random_point_in_zone',
                    params: {
                        zone: {xMinPercent: 0.2, xMaxPercent: 0.8, yMinPercent: 0.2, yMaxPercent: 0.8}
                    }
                },
                movement: {type: 'seek', target: {type: 'point'}, speed: 400},
                triggers: [{condition: 'distance_to_target_less_than', value: 50, newStateIndex: 7}],
                duration: 2.5,
                nextStateIndex: 7
            },
            {
                name: "Phase3_Snipe",
                duration: 1.5,
                movement: {type: 'stop'},
                combat: {tactic: 'always_fire'},
                nextStateIndex: 1
            }
        ]
    },
};
const ARCHETYPE_VOID_WEAVER = {
    ...BASE_BOSS,
    name: 'Void Weaver',
    speed: 300,
    hp: 420,
    collisionDamage: 150,
    behavior: {
        boundaryBehavior: 'stay_in_bounds',
        script: [

            {
                name: "Enter",
                duration: 1.5,
                movement: {type: 'seek', target: {type: 'relative_point', xPercent: 0.8, yPercent: 0.2}},
                nextStateIndex: 1
            },

            {
                name: "MoveCornerTopLeft",
                onEnter: {action: 'switch_weapon', params: {weaponIndex: 0}},
                movement: {type: 'seek', target: {type: 'relative_point', xPercent: 0.15, yPercent: 0.2}},
                triggers: [{condition: 'distance_to_target_less_than', value: 50, newStateIndex: 2}],
                duration: 2.5,
                nextStateIndex: 2
            },

            {
                name: "FireCornerTopLeft",
                duration: 1.5,
                movement: {type: 'stop'},
                combat: {tactic: 'always_fire'},
                nextStateIndex: 3
            },

            {
                name: "DashToPlayer1",
                onEnter: {action: 'switch_weapon', params: {weaponIndex: 1}},
                movement: {type: 'seek', target: {type: 'player'}, speed: 500},
                triggers: [{condition: 'distance_to_target_less_than', value: 150, newStateIndex: 4}],
                duration: 1.5,
                nextStateIndex: 4
            },

            {
                name: "DeployWeb1",
                duration: 0.4,
                movement: {type: 'stop'},
                combat: {tactic: 'always_fire'},
                nextStateIndex: 5
            },

            {
                name: "MoveCornerBottomRight",
                onEnter: {action: 'switch_weapon', params: {weaponIndex: 0}},
                movement: {type: 'seek', target: {type: 'relative_point', xPercent: 0.85, yPercent: 0.8}},
                triggers: [{condition: 'distance_to_target_less_than', value: 50, newStateIndex: 6}],
                duration: 2.5,
                nextStateIndex: 6
            },

            {
                name: "FireCornerBottomRight",
                duration: 1.5,
                movement: {type: 'stop'},
                combat: {tactic: 'always_fire'},
                nextStateIndex: 7
            },

            {
                name: "DashToCenter",
                onEnter: {action: 'switch_weapon', params: {weaponIndex: 1}},
                movement: {type: 'seek', target: {type: 'relative_point', xPercent: 0.5, yPercent: 0.5}},
                triggers: [{condition: 'distance_to_target_less_than', value: 50, newStateIndex: 8}],
                duration: 1.5,
                nextStateIndex: 8
            },

            {
                name: "DeployWebCenter",
                duration: 0.4,
                movement: {type: 'stop'},
                combat: {tactic: 'always_fire'},
                nextStateIndex: 1
            }
        ]
    }
};
const ARCHETYPE_ORBITAL_WARDEN = {
    ...BASE_BOSS,
    name: 'Orbital Warden',
    speed: 100,
    hp: 800,
    collisionDamage: 300,
    behavior: {
        boundaryBehavior: 'stay_in_bounds',
        script: [

            {
                name: "EnterArena",
                duration: 4,
                movement: {
                    type: 'seek',
                    target: {type: 'relative_point', xPercent: 0.85, yPercent: 0.5},
                    speed: 150,
                },
                triggers: [{condition: 'distance_to_target_less_than', value: 30, newStateIndex: 1}]
            },

            {
                name: "GatlingPositionTop",
                duration: 2,
                onEnter: {action: 'switch_weapon', params: {weaponIndex: 0}},
                movement: {
                    type: 'seek',
                    target: {type: 'relative_point', xPercent: 0.85, yPercent: 0.15},
                    speed: 250
                },
                combat: {tactic: 'always_fire'},
                nextStateIndex: 2
            },

            {
                name: "GatlingSweepDown",
                duration: 3,
                movement: {
                    type: 'seek',
                    target: {type: 'relative_point', xPercent: 0.85, yPercent: 0.85},
                    speed: 180
                },
                combat: {tactic: 'always_fire'},
                nextStateIndex: 3
            },

            {
                name: "GatlingSweepUp",
                duration: 3,
                movement: {
                    type: 'seek',
                    target: {type: 'relative_point', xPercent: 0.85, yPercent: 0.15},
                    speed: 180
                },
                combat: {tactic: 'always_fire'},
                nextStateIndex: 4
            },

            {
                name: "ArtilleryPosition",
                duration: 2,
                onEnter: {action: 'switch_weapon', params: {weaponIndex: 2}},
                movement: {
                    type: 'seek',
                    target: {type: 'relative_point', xPercent: 0.95, yPercent: 0.5},
                    speed: 300
                },
                nextStateIndex: 5
            },

            {
                name: "CannonFire1",
                duration: 1.5,
                movement: {type: 'stop'},
                combat: {tactic: 'always_fire'},
                nextStateIndex: 6
            },

            {
                name: "ArtilleryShift",
                duration: 1,
                movement: {
                    type: 'linear',
                    target: {angle: 90},
                    speed: 100
                },
                nextStateIndex: 7
            },

            {
                name: "CannonFire2",
                duration: 1.5,
                movement: {type: 'stop'},
                combat: {tactic: 'always_fire'},
                nextStateIndex: 8
            },

            {
                name: "FluxChargePrep",
                duration: 1.5,
                onEnter: {action: 'switch_weapon', params: {weaponIndex: 1}},
                movement: {
                    type: 'seek',
                    target: {type: 'relative_point', xPercent: 0.85, yPercent: 0.5},
                    speed: 300
                },
                nextStateIndex: 9
            },

            {
                name: "TheWallPush",
                duration: 5,
                movement: {
                    type: 'linear',
                    target: {angle: 180},
                    speed: 80
                },
                combat: {tactic: 'always_fire'},
                nextStateIndex: 10
            },

            {
                name: "Retreat",
                duration: 2,
                movement: {
                    type: 'seek',
                    target: {type: 'relative_point', xPercent: 0.9, yPercent: 0.15},
                    speed: 400
                },

                nextStateIndex: 1
            }
        ]
    }
};
const ARCHETYPE_BINARY_STAR = {
    ...BASE_BOSS,
    name: 'Binary Star',
    speed: 50,
    hp: 1500,
    collisionDamage: 100,
    behavior: {
        boundaryBehavior: 'stay_in_bounds',
        script: [

            {
                name: "Phase1_Enter",
                duration: 3,
                onEnter: {action: 'switch_weapon', params: {weaponIndex: 0}},
                movement: {type: 'seek', target: {type: 'relative_point', xPercent: 0.75, yPercent: 0.5}, speed: 100},
                nextStateIndex: 1
            },

            {
                name: "Phase1_DriftUp",
                duration: 4,
                movement: {type: 'linear', target: {angle: 270}, speed: 30},
                combat: {tactic: 'always_fire'},
                triggers: [
                    {condition: 'hp_percent_less_than', value: 50, newStateIndex: 3}
                ],
                nextStateIndex: 2
            },

            {
                name: "Phase1_DriftDown",
                duration: 4,
                movement: {type: 'linear', target: {angle: 90}, speed: 30},
                combat: {tactic: 'always_fire'},
                triggers: [
                    {condition: 'hp_percent_less_than', value: 50, newStateIndex: 3}
                ],
                nextStateIndex: 1
            },

            {
                name: "Transformation",
                duration: 2.0,
                movement: {type: 'stop'},
                onEnter: {action: 'switch_weapon', params: {weaponIndex: 1}},

                nextStateIndex: 4
            },

            {
                name: "Phase2_Charge",
                duration: 1.0,
                movement: {type: 'seek', target: {type: 'player'}, speed: 500},
                nextStateIndex: 5
            },

            {
                name: "Phase2_Fire",
                duration: 1.0,
                movement: {type: 'stop'},
                combat: {tactic: 'always_fire'},
                nextStateIndex: 6
            },

            {
                name: "Phase2_Reposition",
                duration: 1.5,
                onEnter: {
                    action: 'generate_random_point_in_zone',
                    params: {zone: {xMinPercent: 0.1, xMaxPercent: 0.9, yMinPercent: 0.1, yMaxPercent: 0.9}}
                },
                movement: {type: 'seek', target: {type: 'point'}, speed: 300},
                combat: {tactic: 'always_fire'},
                nextStateIndex: 4
            }
        ]
    }
};
const ARCHETYPE_ENTROPY_SOWER = {
    ...BASE_BOSS,
    name: 'The Grid Architect',
    speed: 150,
    hp: 1800,
    collisionDamage: 200,
    behavior: {
        boundaryBehavior: 'stay_in_bounds',
        script: [

            {
                name: "Enter",
                duration: 2,
                movement: {type: 'seek', target: {type: 'relative_point', xPercent: 0.85, yPercent: 0.5}},
                nextStateIndex: 1
            },

            {
                name: "Ph1_MoveTop",
                duration: 2,
                onEnter: {action: 'switch_weapon', params: {weaponIndex: 0}},
                movement: {type: 'seek', target: {type: 'relative_point', xPercent: 0.8, yPercent: 0.1}},
                combat: {tactic: 'always_fire'},
                triggers: [{condition: 'hp_percent_less_than', value: 75, newStateIndex: 7}],
                nextStateIndex: 2
            },

            {
                name: "Ph1_PlantMine1",
                duration: 0.2,
                movement: {type: 'stop'},
                onEnter: {action: 'spawn_entity', params: {typeId: 10003, offsetX: -50}},
                nextStateIndex: 3
            },

            {
                name: "Ph1_MoveMid",
                duration: 1.5,
                movement: {type: 'seek', target: {type: 'relative_point', xPercent: 0.8, yPercent: 0.5}},
                combat: {tactic: 'always_fire'},
                triggers: [{condition: 'hp_percent_less_than', value: 75, newStateIndex: 7}],
                nextStateIndex: 4
            },

            {
                name: "Ph1_PlantMine2",
                duration: 0.2,
                movement: {type: 'stop'},
                onEnter: {action: 'spawn_entity', params: {typeId: 10003, offsetX: -50}},
                nextStateIndex: 5
            },

            {
                name: "Ph1_MoveBot",
                duration: 1.5,
                movement: {type: 'seek', target: {type: 'relative_point', xPercent: 0.8, yPercent: 0.9}},
                combat: {tactic: 'always_fire'},
                triggers: [{condition: 'hp_percent_less_than', value: 75, newStateIndex: 7}],
                nextStateIndex: 6
            },

            {
                name: "Ph1_PlantMine3",
                duration: 0.2,
                movement: {type: 'stop'},
                onEnter: {action: 'spawn_entity', params: {typeId: 10003, offsetX: -50}},
                nextStateIndex: 1
            },

            {
                name: "Trans_To_Ph2",
                duration: 1.5,
                movement: {type: 'seek', target: {type: 'relative_point', xPercent: 0.5, yPercent: 0.5}, speed: 400},
                nextStateIndex: 8
            },

            {
                name: "Ph2_PrepareCage",
                duration: 1.0,
                movement: {type: 'stop'},
                onEnter: {action: 'switch_weapon', params: {weaponIndex: 1}},
                combat: {tactic: 'always_fire'},
                triggers: [{condition: 'hp_percent_less_than', value: 50, newStateIndex: 14}],
                nextStateIndex: 9
            },

            {
                name: "Ph2_SpawnNorth",
                duration: 0.1,
                movement: {type: 'stop'},
                onEnter: {action: 'spawn_entity', params: {typeId: 10003, offsetX: 0, offsetY: -150}},
                nextStateIndex: 10
            },

            {
                name: "Ph2_SpawnSouth",
                duration: 0.1,
                movement: {type: 'stop'},
                onEnter: {action: 'spawn_entity', params: {typeId: 10003, offsetX: 0, offsetY: 150}},
                nextStateIndex: 11
            },

            {
                name: "Ph2_SpawnWest",
                duration: 0.1,
                movement: {type: 'stop'},
                onEnter: {action: 'spawn_entity', params: {typeId: 10003, offsetX: -150, offsetY: 0}},
                nextStateIndex: 12
            },

            {
                name: "Ph2_SpawnEast",
                duration: 0.1,
                movement: {type: 'stop'},
                onEnter: {action: 'spawn_entity', params: {typeId: 10003, offsetX: 150, offsetY: 0}},
                nextStateIndex: 13
            },

            {
                name: "Ph2_Rest",
                duration: 3.0,
                movement: {type: 'stop'},
                combat: {tactic: 'always_fire'},
                triggers: [{condition: 'hp_percent_less_than', value: 50, newStateIndex: 14}],
                nextStateIndex: 8
            },

            {
                name: "Trans_To_Ph3",
                duration: 1.0,

                movement: {type: 'seek', target: {type: 'relative_point', xPercent: 0.5, yPercent: 0.5}, speed: 300},
                nextStateIndex: 15
            },

            {
                name: "Ph3_RandomJump",
                duration: 2.0,
                onEnter: {
                    action: 'generate_random_point_in_zone',
                    params: {zone: {xMinPercent: 0.1, xMaxPercent: 0.9, yMinPercent: 0.1, yMaxPercent: 0.9}}
                },
                movement: {type: 'seek', target: {type: 'point'}, speed: 300},
                triggers: [{condition: 'hp_percent_less_than', value: 25, newStateIndex: 17}],
                nextStateIndex: 16
            },

            {
                name: "Ph3_PlantMineHere",
                duration: 0.5,
                movement: {type: 'stop'},
                onEnter: {action: 'spawn_entity', params: {typeId: 10003, offsetX: 0, offsetY: 0}},
                combat: {tactic: 'always_fire'},
                triggers: [{condition: 'hp_percent_less_than', value: 25, newStateIndex: 17}],
                nextStateIndex: 15
            },

            {
                name: "Trans_To_Ph4",
                duration: 0.5,
                movement: {type: 'stop'},
                nextStateIndex: 18
            },

            {
                name: "Ph4_SwitchMode",
                duration: 0.1,
                movement: {type: 'stop'},
                onEnter: {action: 'switch_weapon', params: {weaponIndex: 2}},
                nextStateIndex: 19
            },

            {
                name: "Ph4_FleeMove",
                duration: 1.0,
                onEnter: {
                    action: 'generate_random_point_in_zone',
                    params: {zone: {xMinPercent: 0.1, xMaxPercent: 0.9, yMinPercent: 0.1, yMaxPercent: 0.9}}
                },
                movement: {type: 'seek', target: {type: 'point'}, speed: 400},
                combat: {tactic: 'always_fire'},
                nextStateIndex: 20
            },

            {
                name: "Ph4_GlobalSpawn",
                duration: 0.2,
                movement: {type: 'stop'},
                onEnter: {
                    action: 'spawn_entity',
                    params: {
                        typeId: 10003,
                        spawnMode: 'global_random',
                        safeRadius: 250
                    }
                },
                nextStateIndex: 21
            },

            {
                name: "Ph4_GlobalSpawn2",
                duration: 0.1,
                movement: {type: 'stop'},
                onEnter: {
                    action: 'spawn_entity',
                    params: {
                        typeId: 10003,
                        spawnMode: 'global_random',
                        safeRadius: 250
                    }
                },
                nextStateIndex: 18
            }
        ]
    }
};

const ARCHETYPE_VOID_CARRIER = {
    ...BASE_BOSS,
    name: 'The Void Carrier',
    speed: 100,
    hp: 1000,
    collisionDamage: 300,
    behavior: {
        boundaryBehavior: 'stay_in_bounds',
        script: [

            {
                name: "EnterArena",
                duration: 2,
                movement: {type: 'seek', target: {type: 'relative_point', xPercent: 0.8, yPercent: 0.2}},
                nextStateIndex: 1
            },

            {
                name: "Ph1_MoveBottomLeft",
                duration: 4,
                movement: {type: 'seek', target: {type: 'relative_point', xPercent: 0.2, yPercent: 0.8}, speed: 120},
                combat: {tactic: 'fire_if_player_in_range', range: 300},
                triggers: [{condition: 'hp_percent_less_than', value: 75, newStateIndex: 6}],
                nextStateIndex: 2
            },

            {
                name: "Ph1_Squadron_Left",
                duration: 0.1,
                movement: {type: 'stop'},
                onEnter: {action: 'spawn_entity', params: {typeId: 10001, offsetX: -60, offsetY: -40, maxCount: 50}},
                nextStateIndex: 3
            },
            {
                name: "Ph1_Squadron_Right",
                duration: 0.1,
                movement: {type: 'stop'},
                onEnter: {action: 'spawn_entity', params: {typeId: 10001, offsetX: -60, offsetY: 40, maxCount: 50}},
                nextStateIndex: 4
            },
            {
                name: "Ph1_Squadron_Center",
                duration: 0.5,
                movement: {type: 'stop'},
                onEnter: {action: 'spawn_entity', params: {typeId: 10001, offsetX: -80, offsetY: 0, maxCount: 50}},
                nextStateIndex: 5
            },

            {
                name: "Ph1_MoveTopRight",
                duration: 4,
                movement: {type: 'seek', target: {type: 'relative_point', xPercent: 0.8, yPercent: 0.2}, speed: 120},
                combat: {tactic: 'fire_if_player_in_range', range: 300},
                triggers: [{condition: 'hp_percent_less_than', value: 75, newStateIndex: 6}],
                nextStateIndex: 2
            },

            {
                name: "Trans_To_Ph2",
                duration: 2.0,

                movement: {type: 'seek', target: {type: 'relative_point', xPercent: 0.9, yPercent: 0.1}, speed: 250},
                nextStateIndex: 7
            },

            {
                name: "Ph2_D_Burst1",
                duration: 0.2,
                movement: {type: 'stop'},
                onEnter: {action: 'spawn_entity', params: {typeId: 10002, offsetX: -50, offsetY: 0, maxCount: 50}},
                triggers: [{condition: 'hp_percent_less_than', value: 25, newStateIndex: 15}],
                nextStateIndex: 8
            },

            {
                name: "Ph2_D_Burst2",
                duration: 0.2,
                movement: {type: 'stop'},
                onEnter: {action: 'spawn_entity', params: {typeId: 10002, offsetX: -50, offsetY: 30, maxCount: 50}},
                triggers: [{condition: 'hp_percent_less_than', value: 25, newStateIndex: 15}],
                nextStateIndex: 9
            },

            {
                name: "Ph2_D_Burst3",
                duration: 0.2,
                movement: {type: 'stop'},
                onEnter: {action: 'spawn_entity', params: {typeId: 10002, offsetX: -50, offsetY: -30, maxCount: 50}},
                triggers: [{condition: 'hp_percent_less_than', value: 25, newStateIndex: 15}],
                nextStateIndex: 10
            },

            {
                name: "Ph2_D_BreatherMove",
                duration: 3.0,

                movement: {type: 'seek', target: {type: 'relative_point', xPercent: 0.9, yPercent: 0.9}, speed: 120},
                triggers: [
                    {condition: 'hp_percent_less_than', value: 25, newStateIndex: 15},

                    {condition: 'distance_to_target_less_than', value: 50, newStateIndex: 11}
                ],

                nextStateIndex: 7
            },

            {
                name: "Ph2_U_Burst1",
                duration: 0.2,
                movement: {type: 'stop'},
                onEnter: {action: 'spawn_entity', params: {typeId: 10002, offsetX: -50, offsetY: 0, maxCount: 50}},
                triggers: [{condition: 'hp_percent_less_than', value: 25, newStateIndex: 15}],
                nextStateIndex: 12
            },

            {
                name: "Ph2_U_Burst2",
                duration: 0.2,
                movement: {type: 'stop'},
                onEnter: {action: 'spawn_entity', params: {typeId: 10002, offsetX: -50, offsetY: 30, maxCount: 50}},
                triggers: [{condition: 'hp_percent_less_than', value: 25, newStateIndex: 15}],
                nextStateIndex: 13
            },

            {
                name: "Ph2_U_Burst3",
                duration: 0.2,
                movement: {type: 'stop'},
                onEnter: {action: 'spawn_entity', params: {typeId: 10002, offsetX: -50, offsetY: -30, maxCount: 50}},
                triggers: [{condition: 'hp_percent_less_than', value: 25, newStateIndex: 15}],
                nextStateIndex: 14
            },

            {
                name: "Ph2_U_BreatherMove",
                duration: 2.0,

                movement: {type: 'seek', target: {type: 'relative_point', xPercent: 0.9, yPercent: 0.1}, speed: 120},
                triggers: [
                    {condition: 'hp_percent_less_than', value: 25, newStateIndex: 15},

                    {condition: 'distance_to_target_less_than', value: 50, newStateIndex: 7}
                ],
                nextStateIndex: 11
            },

            {
                name: "Trans_To_Ph3",
                duration: 2.0,
                movement: {type: 'seek', target: {type: 'relative_point', xPercent: 0.7, yPercent: 0.5}, speed: 300},
                onEnter: {action: 'switch_weapon', params: {weaponIndex: 0}},
                nextStateIndex: 16
            },

            {
                name: "Ph3_MassDeploy",
                duration: 0.6,
                movement: {type: 'stop'},
                onEnter: {
                    action: 'spawn_entity',
                    params: {typeId: 10001, offsetX: -50, offsetY: 0, maxCount: 50}
                },
                nextStateIndex: 17
            },
            {
                name: "Ph3_MassDeploy2",
                duration: 0.1,
                movement: {type: 'stop'},
                onEnter: {
                    action: 'spawn_entity',
                    params: {typeId: 10001, offsetX: -50, offsetY: -60, maxCount: 50}
                },
                nextStateIndex: 18
            },
            {
                name: "Ph3_MassDeploy3",
                duration: 0.1,
                movement: {type: 'stop'},
                onEnter: {
                    action: 'spawn_entity',
                    params: {typeId: 10001, offsetX: -50, offsetY: 60, maxCount: 50}
                },
                nextStateIndex: 19
            },

            {
                name: "Ph3_DefensiveStance",
                duration: 5.0,
                movement: {type: 'linear', target: {angle: 180}, speed: 10},
                combat: {tactic: 'fire_if_player_in_range', range: 500},
                nextStateIndex: 16
            }
        ]
    }
};

module.exports = {
    ARCHETYPE_CLASSIC_GUARDIAN,
    ARCHETYPE_ANNIHILATOR,
    ARCHETYPE_VOID_WEAVER,
    ARCHETYPE_ORBITAL_WARDEN,
    ARCHETYPE_BINARY_STAR,
    ARCHETYPE_ENTROPY_SOWER,
    ARCHETYPE_VOID_CARRIER
};
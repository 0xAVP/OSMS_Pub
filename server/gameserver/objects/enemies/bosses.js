const {WEAPONS} = require('./weapons/weapons');
const {buildEnemies} = require('./_builder');

const {
    ARCHETYPE_CLASSIC_GUARDIAN, ARCHETYPE_ANNIHILATOR, ARCHETYPE_VOID_WEAVER, ARCHETYPE_ORBITAL_WARDEN,
    ARCHETYPE_BINARY_STAR, ARCHETYPE_ENTROPY_SOWER, ARCHETYPE_VOID_CARRIER
} = require('./_boss_archetypes');

const bossDefinitions = {

    1001: {
        archetype: ARCHETYPE_CLASSIC_GUARDIAN,
        weapons: [
            {weapon: WEAPONS.bossSpreadWeapon, weight: 0.5},
            {weapon: WEAPONS.bossBurstFastWeapon, weight: 0.5}
        ]
    },
    1002: {
        archetype: ARCHETYPE_ANNIHILATOR,
        weapons: [
            {weapon: WEAPONS.bossSpinWeapon, weight: 0},
            {weapon: WEAPONS.bossSpreadWeapon, weight: 0},
            {weapon: WEAPONS.bossBurstFastWeapon, weight: 0.5}
        ]
    },
    1003: {
        archetype: ARCHETYPE_VOID_WEAVER,
        weapons: [
            {weapon: WEAPONS.bossWeaverShotgun, weight: 0},
            {weapon: WEAPONS.bossWeaverWeb, weight: 0},
        ]
    },
    1004: {
        archetype: ARCHETYPE_ORBITAL_WARDEN,
        weapons: [
            {weapon: WEAPONS.bossWardenGatling, weight: 0},
            {weapon: WEAPONS.bossWardenFluxCross, weight: 0},
            {weapon: WEAPONS.bossWardenCannon, weight: 0}
        ]
    },
    1005: {
        archetype: ARCHETYPE_BINARY_STAR,
        weapons: [
            {weapon: WEAPONS.bossStarNova, weight: 0},
            {weapon: WEAPONS.bossRageBurst, weight: 0}
        ]
    },
    1006: {
        archetype: ARCHETYPE_ENTROPY_SOWER,
        weapons: [
            {weapon: WEAPONS.bossArchitectRifle, weight: 0},
            {weapon: WEAPONS.bossArchitectShotgun, weight: 0},
            {weapon: WEAPONS.bossArchitectPanic, weight: 0}
        ]
    },
    1007: {
        archetype: ARCHETYPE_VOID_CARRIER,
        weapons: [

            {weapon: WEAPONS.bossCarrierPDL, weight: 0}
        ]
    }

};

const BOSSES = buildEnemies(bossDefinitions);

module.exports = {BOSSES};
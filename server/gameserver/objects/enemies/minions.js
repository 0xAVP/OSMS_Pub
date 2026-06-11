const {WEAPONS} = require('./weapons/weapons');
const {buildEnemies} = require('./_builder');
const {
    ARCHETYPE_MINION_GRUNT_LINEAR,
    ARCHETYPE_MINION_DEBRIS, ARCHETYPE_MINION_KAMIKAZE, ARCHETYPE_MINION_MINE
} = require('./_minion_archetypes');

const minionDefinitions = {

    10001: {
        archetype: ARCHETYPE_MINION_GRUNT_LINEAR,
        weapons: [
            {weapon: WEAPONS.singleWeapon, weight: 1}
        ]
    },
    10002: {
        archetype: ARCHETYPE_MINION_KAMIKAZE
    },
    10003: {
        archetype: ARCHETYPE_MINION_MINE
    },
    10100: {
        archetype: ARCHETYPE_MINION_DEBRIS

    },
};

const MINIONS = buildEnemies(minionDefinitions);

module.exports = {MINIONS};
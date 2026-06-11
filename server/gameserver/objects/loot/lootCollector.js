const {RESOURCES} = require('./resources');
const {BLUEPRINTS} = require('./blueprints');

const LOOT_ITEMS = {
    resources: Object.keys(RESOURCES),
    blueprints: Object.keys(BLUEPRINTS)
};

function createZeroedObject(ids) {
    return ids.reduce((acc, id) => {
        acc[id] = 0;
        return acc;
    }, {});
}

function initializeLoot() {
    return {
        resources: createZeroedObject(LOOT_ITEMS.resources),
        blueprints: createZeroedObject(LOOT_ITEMS.blueprints),
        stagestones: {}
    };
}

module.exports = {LOOT_ITEMS, initializeLoot};
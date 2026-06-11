const {RESOURCES} = require('./resources');
const {BLUEPRINTS} = require('./blueprints');
const logger = require("../../core/logger");

const CATEGORY = Object.freeze({
    RESOURCE: 1,
    BLUEPRINT: 100,
    STAGESTONE: 200
});

class LootIdManager {
    constructor() {
        this.nameToId = new Map();
        this.idToName = new Map();
        this.dictionaryCache = null;
        this._initialize();
        this.dictionaryCache = this._buildDictionary();
        logger.info(`[LootIdManager] Initialized with ${this.nameToId.size} static items and pre-built dictionary.`);
    }

    _initialize() {
        const resourceKeys = Object.keys(RESOURCES).sort();
        const blueprintKeys = Object.keys(BLUEPRINTS).sort();

        resourceKeys.forEach((name, index) => {
            const id = CATEGORY.RESOURCE + index;
            this.nameToId.set(name, id);
            this.idToName.set(id, name);
        });

        blueprintKeys.forEach((name, index) => {
            const id = CATEGORY.BLUEPRINT + index;
            this.nameToId.set(name, id);
            this.idToName.set(id, name);
        });
    }

    getId(name) {
        if (name.startsWith('stagestone_tier_')) {
            const tier = parseInt(name.split('_')[2], 10);
            return isNaN(tier) ? null : CATEGORY.STAGESTONE + tier;
        }
        return this.nameToId.get(name) || null;
    }

    getName(id) {
        if (id >= CATEGORY.STAGESTONE) {
            const tier = id - CATEGORY.STAGESTONE;
            return `stagestone_tier_${tier}`;
        }
        return this.idToName.get(id) || null;
    }

    _buildDictionary() {
        const dictionary = {};
        for (const [name, id] of this.nameToId.entries()) {

            const itemData = RESOURCES[name] || BLUEPRINTS[name];

            if (itemData && itemData.name) {
                dictionary[id] = {
                    key: name,
                    name: itemData.name,
                    rarity: itemData.rarity || 'common'
                };
            } else {

                dictionary[id] = {
                    key: name,
                    name: name.replace(/_/g, ' '),
                    rarity: 'common'
                };
            }
        }

        dictionary[CATEGORY.STAGESTONE] = {
            key: 'stagestone_tier_',
            name: 'Stagestone Tier ',
            rarity: 'default'
        };
        return dictionary;
    }

    /**
     * Генерирует полный словарь для отправки клиенту.
     * ТЕПЕРЬ ПРОСТО ВОЗВРАЩАЕТ ГОТОВЫЙ ОБЪЕКТ ИЗ КЭША.
     * @returns {object}
     */
    getDictionary() {
        return this.dictionaryCache;
    }
}

module.exports = new LootIdManager();
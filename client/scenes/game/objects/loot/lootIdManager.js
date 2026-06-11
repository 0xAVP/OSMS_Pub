class LootIdManager {
    constructor() {
        this.idToData = new Map();
        this.stagestoneData = null;
        this.stagestoneBaseId = 0;
    }

    /**
     * @param {object} dictionary - Объект вида { "1001": { key: "...", name: "...", rarity: "..." }, ... }
     */
    initialize(dictionary) {
        this.idToData.clear();
        for (const idStr in dictionary) {
            const id = parseInt(idStr, 10);
            const data = dictionary[idStr];

            if (data.key.endsWith('_tier_')) {
                this.stagestoneData = data;
                this.stagestoneBaseId = id;
            } else {
                this.idToData.set(id, data);
            }
        }
        console.log(`[LootIdManager] Initialized with ${this.idToData.size} static items.`);
    }

    /**
     * @param {number} id - Числовой ID.
     * @returns {{key: string, name: string, rarity: string}|null} - Объект с данными или null.
     */
    getItemData(id) {
        if (this.stagestoneBaseId > 0 && id >= this.stagestoneBaseId) {
            const tier = id - this.stagestoneBaseId;
            return {
                key: this.stagestoneData.key + tier,
                name: this.stagestoneData.name + tier,
                rarity: this.stagestoneData.rarity
            };
        }
        return this.idToData.get(id) || null;
    }
}

export default new LootIdManager();
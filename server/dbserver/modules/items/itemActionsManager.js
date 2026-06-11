/**
 * @file Главный диспетчер для ВСЕХ используемых предметов.
 */

const {isStagestone, getStagestoneData} = require('../../catalog/stagestones.js');

const {getBuffDefinition} = require('../../catalog/buffs/catalog.js');
const {activateBuff} = require('../buffs/buffsManager.js');

/**
 * Главная функция-диспетчер.
 */
async function useItem(payload, walletAddress) {
    walletAddress = walletAddress?.toLowerCase();
    const {itemId} = payload;

    let itemData = null;
    if (isStagestone(itemId)) {
        itemData = getStagestoneData(itemId);
    }
    /*
    else {
        itemData = getBooster(itemId);
    }
    */

    if (!itemData) {
        return {success: false, error: `Item '${itemId}' is not a usable item.`};
    }

    if (!itemData.attributes?.isUsable) {
        return {success: false, error: `Item '${itemId}' is not marked as usable.`};
    }

    if (itemData.activatesBuff) {
        const buffId = itemData.activatesBuff;
        const buffDef = getBuffDefinition(buffId);

        if (!buffDef) {
            return {success: false, error: `Definition for buff '${buffId}' not found.`};
        }

        return await activateBuff(walletAddress, itemData, buffDef);
    }

    return {success: false, error: `No action defined for item '${itemId}'.`};
}

module.exports = {useItem};
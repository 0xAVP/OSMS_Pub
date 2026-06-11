const {getModule} = require('../../catalog/catalog');
const {findItemsInInventory} = require('../inventory/inventory');
const logger = require('../../core/logger');
const {processWeapon} = require('./bpmodules/weapons');
const {processShield} = require('./bpmodules/shields');
const {processArmor} = require('./bpmodules/armor');
const {processEngine} = require('./bpmodules/engines');

async function checkBlueprintResources(blueprint, quantity, walletAddress) {
    if (walletAddress) walletAddress = walletAddress.toLowerCase();
    const requiredResources = blueprint.requiredResources;
    const itemsToCheck = Object.entries(requiredResources).map(([itemKey, data]) => ({
        itemKey,
        category: data.category
    }));

    const inventoryResult = await findItemsInInventory(walletAddress, itemsToCheck);
    if (!inventoryResult.success) {
        logger.error(`Failed to check resources for ${blueprint.key}: ${inventoryResult.error}`, `craft_${walletAddress}`);
        return {success: false, error: inventoryResult.error};
    }

    const {items} = inventoryResult;
    const missingResources = [];

    for (const [itemKey, requiredData] of Object.entries(requiredResources)) {
        const requiredQuantity = requiredData.quantity * quantity;
        const availableQuantity = items.get(itemKey);

        if (availableQuantity < requiredQuantity) {
            missingResources.push({
                resource: itemKey,
                required: requiredQuantity,
                available: availableQuantity
            });
        }
    }

    if (missingResources.length > 0) {
        const errorMessage = `Insufficient resources for ${blueprint.key}: ${missingResources.map(r => `${r.resource} (need ${r.required}, have ${r.available})`).join(', ')}`;
        logger.error(errorMessage, `craft_${walletAddress}`);
        return {success: false, error: errorMessage};
    }

    return {success: true, resources: requiredResources};
}

async function createModule(blueprintData, quantity) {
    try {
        const {itemCrafted} = blueprintData;

        const craftedItem = Object.entries(itemCrafted)[0];
        const itemKey = craftedItem[0];
        const itemQuantity = craftedItem[1].quantity * quantity;

        const moduleData = getModule(itemKey);

        const itemType = moduleData.type;
        const itemCategory = moduleData.category;

        const craftedModules = [];
        let processResult;

        for (let i = 0; i < itemQuantity; i++) {
            switch (itemType) {
                case 'weapon':
                    processResult = await processWeapon(craftedItem[1]);
                    break;
                case 'shield':
                    processResult = await processShield(craftedItem[1]);
                    break;
                case 'armor':
                    processResult = await processArmor(craftedItem[1]);
                    break;
                case 'engine':
                    processResult = await processEngine(craftedItem[1]);
                    break;
                default:
                    console.log(`Недействительный type: ${itemType} для blueprint`);
                    return {success: false, error: 'Wrong item type'};
            }

            if (!processResult.success) {
                console.log(`Ошибка обработки чертежа типа ${itemType}: ${processResult.error}`);
                return processResult;
            }
            craftedModules.push(processResult.data.module);
        }

        return {
            success: true,
            data: {
                key: itemKey,
                quantity: itemQuantity,
                category: itemCategory,
                craftedModules
            }
        };
    } catch (error) {
        return {success: false, error: 'Could not get itemCrafted for Blueprint'};
    }
}

module.exports = {checkBlueprintResources, createModule};
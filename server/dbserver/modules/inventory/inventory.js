const mongoose = require('mongoose');
const inventorySchema = require('./schema');
const {isValidResource, isValidBlueprint, isValidStagestone} = require('../../catalog/itemValidator');
const logger = require('../../core/logger');
const Inventory = mongoose.model('inventories', inventorySchema);

async function createInventory(walletAddress) {
    walletAddress = walletAddress?.toLowerCase();

    if (!walletAddress || !/^0x[a-f0-9]{40}$/.test(walletAddress)) {
        logger.error(`Invalid walletAddress`, `inventory`);
        return {success: false, error: 'Invalid walletAddress'};
    }
    try {

        const result = await Inventory.findOneAndUpdate(
            {walletAddress},
            {$setOnInsert: {walletAddress}},
            {upsert: true, new: true, lean: true}
        );

        logger.debug(`Inventory ensured for: ${walletAddress}`, `inventory_${walletAddress}`);

    } catch (error) {
        logger.error(`Error creating inventory for ${walletAddress}: ${error.message}`, `inventory_${walletAddress}`);
        throw error;
    }
}

async function saveLoot(walletAddress, loot) {
    walletAddress = walletAddress?.toLowerCase();

    if (!walletAddress || !/^0x[a-f0-9]{40}$/.test(walletAddress)) {
        logger.error(`Invalid walletAddress`, `inventory`);
        return {success: false, error: 'Invalid walletAddress'};
    }
    if (!loot || typeof loot !== 'object') {
        logger.error(`Invalid loot structure: ${loot}`, `inventory_${walletAddress}`);
        return {success: false, error: 'Invalid loot structure'};
    }

    if (!loot.resources && !loot.blueprints && !loot.stagestones) {
        console.log(`No loot to save for walletAddress: ${walletAddress} [inventory_${walletAddress}]`);
        return {success: true};
    }

    try {
        let inventory = await Inventory.findOne({walletAddress}).lean();
        if (!inventory) {
            logger.error(`Inventory not found for walletAddress: ${walletAddress}`, `inventory_${walletAddress}`);
            return {success: false, error: 'Inventory not found'};
        }

        const updateFields = {};

        const stagestones = loot.stagestones || {};
        for (const [name, quantity] of Object.entries(stagestones)) {
            if (!isValidStagestone(name)) {
                console.log(`Skipping invalid stagestone key: ${name}`);
                continue;
            }
            const numQuantity = Number(quantity);
            if (isNaN(numQuantity) || numQuantity <= 0) {
                console.log(`Skipping stagestone ${name} with invalid quantity: ${quantity}`);
                continue;
            }
            updateFields[`stagestones.${name}.quantity`] = numQuantity;
        }

        const resources = loot.resources || {};
        for (const [name, quantity] of Object.entries(resources)) {
            if (!isValidResource(name)) {
                console.log(`Skipping invalid resource: ${name} [inventory_${walletAddress}]`);
                continue;
            }
            const numQuantity = Number(quantity);
            if (isNaN(numQuantity) || numQuantity <= 0) {
                console.log(`Skipping resource ${name} with invalid or non-positive quantity: ${quantity} [inventory_${walletAddress}]`);
                continue;
            }
            updateFields[`resources.${name}.quantity`] = numQuantity;
        }

        const blueprints = loot.blueprints || {};
        for (const [name, quantity] of Object.entries(blueprints)) {
            if (!isValidBlueprint(name)) {
                console.log(`Skipping invalid blueprint: ${name} [inventory_${walletAddress}]`);
                continue;
            }
            const numQuantity = Number(quantity);
            if (isNaN(numQuantity) || numQuantity <= 0) {
                console.log(`Skipping blueprint ${name} with invalid or non-positive quantity: ${quantity} [inventory_${walletAddress}]`);
                continue;
            }
            updateFields[`blueprints.${name}.quantity`] = numQuantity;
        }

        if (Object.keys(updateFields).length === 0) {
            console.log(`No items to add for walletAddress: ${walletAddress} [inventory_${walletAddress}]`);
            return {success: true};
        }

        await Inventory.findOneAndUpdate(
            {walletAddress},
            {$inc: updateFields},
            {new: true}
        );

        console.log(`Successfully added loot for walletAddress: ${walletAddress} [inventory_${walletAddress}]`);
        return {success: true, savedLoot: loot};
    } catch (error) {
        logger.error(`Error adding loot for walletAddress ${walletAddress}: ${error.message}`, `inventory_${walletAddress}`);
        return {success: false, error: 'Failed to add loot'};
    }
}

async function getInventory(walletAddress) {

    walletAddress = walletAddress?.toLowerCase();

    if (!walletAddress || !/^0x[a-f0-9]{40}$/.test(walletAddress)) {
        logger.error(`Invalid walletAddress`, `inventory`);
        return {success: false, error: 'Invalid walletAddress'};
    }

    try {
        const inventory = await Inventory.findOne({walletAddress}, {_id: 0, __v: 0, walletAddress: 0}).lean();
        if (!inventory) {
            logger.error(`Инвентарь не найден для ${walletAddress}`, `inventory_${walletAddress}`);
            return {success: false, error: 'Could not found inventory'};
        }

        const resources = inventory.resources ? Object.fromEntries(
            Object.entries(inventory.resources).filter(([_, data]) => data.quantity > 0)
        ) : {};

        const components = inventory.components ? Object.fromEntries(
            Object.entries(inventory.components).filter(([_, data]) => data.quantity > 0)
        ) : {};

        const blueprints = inventory.blueprints ? Object.fromEntries(
            Object.entries(inventory.blueprints).filter(([_, data]) => data.quantity > 0)
        ) : {};

        const modules = inventory.modules ? Object.fromEntries(
            Object.entries(inventory.modules).filter(([_, data]) => data.quantity > 0)
        ) : {};

        const hulls = inventory.hulls ? Object.fromEntries(
            Object.entries(inventory.hulls).filter(([_, data]) => data.quantity > 0)
        ) : {};

        const stagestones = inventory.stagestones ? Object.fromEntries(
            Object.entries(inventory.stagestones).filter(([_, data]) => data.quantity > 0)
        ) : {};

        const other = inventory.other ? Object.fromEntries(
            Object.entries(inventory.other).filter(([_, data]) => data.quantity > 0)
        ) : {};

        return {
            success: true,
            inventory: {
                resources,
                components,
                blueprints,
                modules,
                hulls,
                stagestones,
                other
            }
        };
    } catch (error) {
        logger.error(`Ошибка при получении инвентаря для ${walletAddress}: ${error.message}`, `inventory_${walletAddress}`);
        return {success: false, error: 'Could not found inventory'};
    }
}

async function findItemsInInventory(walletAddress, items) {
    walletAddress = walletAddress?.toLowerCase();

    if (!walletAddress || !/^0x[a-f0-9]{40}$/.test(walletAddress)) {
        logger.error(`Invalid walletAddress`, `inventory`);
        return {success: false, error: 'Invalid walletAddress'};
    }
    try {

        const queryConditions = items.map(({itemKey, category}) => ({
            [`${category}.${itemKey}`]: {$exists: true}
        }));

        const inventory = await Inventory.findOne(
            {walletAddress, $or: queryConditions},
            items.reduce((projection, {itemKey, category}) => {
                projection[`${category}.${itemKey}`] = 1;
                return projection;
            }, {_id: 0})
        ).lean();

        const results = new Map(items.map(({itemKey}) => [itemKey, 0]));

        if (!inventory) {
            return {success: true, items: results};
        }

        for (const {itemKey, category} of items) {

            const itemData = inventory[category]?.[itemKey];

            if (itemData && itemData.quantity) {
                results.set(itemKey, itemData.quantity);
            }
        }

        return {success: true, items: results};

    } catch (error) {
        logger.error(`Error finding items in inventory for ${walletAddress}: ${error.message}`, `inventory_${walletAddress}`);
        return {success: false, error: 'Failed to query inventory'};
    }
}

async function deductResources(session, walletAddress, requiredResources, runsQuantity) {
    walletAddress = walletAddress?.toLowerCase();

    if (!walletAddress || !/^0x[a-f0-9]{40}$/.test(walletAddress)) {
        logger.error(`Invalid walletAddress`, `inventory`);
        return {success: false, error: 'Invalid walletAddress'};
    }
    const updates = {$inc: {}};
    const queryConditions = {walletAddress};

    for (const [itemKey, data] of Object.entries(requiredResources)) {
        const requiredQuantity = data.quantity * runsQuantity;
        if (requiredQuantity <= 0) continue;

        const fieldPath = `${data.category}.${itemKey}.quantity`;

        queryConditions[fieldPath] = {$gte: requiredQuantity};

        updates.$inc[fieldPath] = -requiredQuantity;
    }

    const resourcesToLog = JSON.stringify(updates.$inc);

    logger.warn(`Попытка списания ресурсов для ${walletAddress}. Данные: ${resourcesToLog}`, `inventory_${walletAddress}`);

    try {
        const result = await Inventory.updateOne(queryConditions, updates, {session});

        if (result.matchedCount === 0) {

            throw new Error('Insufficient resources');
        }

    } catch (error) {
        logger.error(`Error deducting resources for ${walletAddress}: ${error.message}`, `inventory_${walletAddress}`);

        throw error;
    }
}

module.exports = {Inventory, createInventory, saveLoot, getInventory, findItemsInInventory, deductResources};
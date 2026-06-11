const mongoose = require('mongoose');
const logger = require('../../../core/logger');
const {Inventory} = require('../../inventory/inventory');
const {getModule} = require('../../../catalog/catalog');

async function dismantleModule(payload, walletAddress) {
    walletAddress = walletAddress?.toLowerCase();
    const logContext = `${walletAddress}`;

    const {moduleKey, moduleUid} = payload;

    const session = await mongoose.startSession();
    try {
        let result;
        await session.withTransaction(async () => {

            const moduleData = getModule(moduleKey);
            if (!moduleData) {
                throw new Error(`Module with key '${moduleKey}' not found in catalog`);
            }

            const dismantleData = moduleData.dismantle;
            if (!dismantleData || typeof dismantleData !== 'object' || Object.keys(dismantleData).length === 0) {
                throw new Error(`Dismantle data not configured for module '${moduleKey}'`);
            }

            const inventory = await Inventory.findOne({walletAddress}).session(session);
            if (!inventory) {
                throw new Error(`Inventory not found for wallet ${walletAddress}`);
            }

            if (!inventory.modules || !inventory.modules.has(moduleUid) || inventory.modules.get(moduleUid).key !== moduleKey) {
                throw new Error(`Module UID '${moduleUid}' not found in inventory or key mismatch`);
            }

            inventory.modules.delete(moduleUid);

            const returnedResources = {};
            for (const [itemKey, {category, quantity}] of Object.entries(dismantleData)) {
                if (!Number.isFinite(quantity) || quantity <= 0) {
                    throw new Error(`Invalid quantity configured for dismantle item ${itemKey}`);
                }
                if (!category || typeof category !== 'string' || !inventory[category]) {
                    throw new Error(`Invalid category configured for dismantle item ${itemKey}`);
                }

                returnedResources[itemKey] = {category, quantity};

                const currentItem = inventory[category].get(itemKey) || {quantity: 0};
                currentItem.quantity += quantity;
                inventory[category].set(itemKey, currentItem);
            }

            await inventory.save({session});

            logger.debug(`[MODULE-DISMANTLE] Module ${moduleKey} dismantled successfully for ${walletAddress}.`, logContext);
            result = {success: true, returnedResources};
        });

        return result;

    } catch (error) {
        logger.error(`Dismantle transaction error: ${error.message}\nStack: ${error.stack}`, logContext);
        return {success: false, error: `Server error during dismantle!`};
    } finally {
        await session.endSession();
    }
}

module.exports = {dismantleModule};
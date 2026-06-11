const mongoose = require('mongoose');
const {Inventory, deductResources} = require('../../inventory/inventory');
const logger = require('../../../core/logger');
const {deepClone, calculateModuleParams} = require('../upgradeUtils');

async function processUpgradeInventoryModule({
                                                 walletAddress,
                                                 moduleUid,
                                                 moduleKey,
                                                 moduleLevel,
                                                 moduleType,
                                                 upgradableParams,
                                                 itemToUpgradeQuantity,
                                                 requiredResources,
                                                 upgradeParams
                                             }) {
    walletAddress = walletAddress?.toLowerCase();
    const logContext = `${walletAddress}`;

    const session = await mongoose.startSession({defaultTransactionOptions: {maxTimeMS: 10000}});
    try {
        let upgradedModule;
        await session.withTransaction(async () => {

            const inventory = await Inventory.findOne({
                walletAddress,
                [`modules.${moduleUid}`]: {$exists: true}
            }, null, {session});
            if (!inventory || !inventory.modules.get(moduleUid)) {
                throw new Error('Module not found in inventory');
            }
            const moduleData = inventory.modules.get(moduleUid);

            if (moduleData.key !== moduleKey || moduleData.level !== moduleLevel) {
                throw new Error(`Client data mismatch for UID ${moduleUid}. Client: ${moduleKey}@${moduleLevel}, DB: ${moduleData.key}@${moduleData.level}.`);
            }

            const paramsResult = calculateModuleParams(moduleData.params, moduleData.initialParams, upgradableParams, upgradeParams, itemToUpgradeQuantity);
            if (!paramsResult.success) {
                throw new Error(paramsResult.error);
            }

            try {
                await deductResources(session, walletAddress, requiredResources, 1);
            } catch (error) {
                throw new Error(`Failed to deduct resources: ${error.message}`);
            }

            const basePath = `modules.${moduleUid}`;
            const updateFields = {
                [`${basePath}.level`]: moduleData.level + itemToUpgradeQuantity,
            };
            Object.entries(paramsResult.changedParams).forEach(([key, value]) => {
                updateFields[`${basePath}.params.${key}`] = value;
            });

            const updateResult = await Inventory.updateOne(
                {walletAddress, [`${basePath}`]: {$exists: true}},
                {$set: updateFields},
                {session}
            );

            if (updateResult.matchedCount === 0) {
                throw new Error('Failed to find module for update during transaction. Possible race condition.');
            }

            upgradedModule = {
                ...moduleData.toObject(),
                uid: moduleUid,
                level: moduleData.level + itemToUpgradeQuantity,
                params: deepClone(paramsResult.params)
            };
        });

        return {success: true, module: upgradedModule};

    } catch (error) {
        logger.error(`[UPGRADE-MODULE-INVENTORY] Upgrade module:inventory failure: ${error.message}\nStack: ${error.stack}`, logContext);
        return {success: false, error: `Upgrading failure!`};
    } finally {
        await session.endSession();
    }
}

module.exports = {processUpgradeInventoryModule};
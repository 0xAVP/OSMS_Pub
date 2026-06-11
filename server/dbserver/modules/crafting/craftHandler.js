const mongoose = require('mongoose');
const {createComponent} = require('./componentsCreator');
const {checkBlueprintResources, createModule} = require('./modulesCreator');
const {Factory, lockCraftingSlot} = require('../factory/factory');
const {Inventory, deductResources} = require('../inventory/inventory');
const logger = require('../../core/logger');
const {getBlueprint} = require("../../catalog/catalog");
const redis = require('../../core/redisClient');
const {logCraftAttempt} = require("../../core/auditLogger");

async function startCraft(payload, walletAddress) {
    walletAddress = walletAddress?.toLowerCase();
    const logContext = `${walletAddress}`;

    const {blueprintKey, itemToCraftQuantity} = payload;

    const hasPilot = await redis.redisClient.sIsMember('pilot_owners_list', walletAddress);
    if (!hasPilot) {
        logger.warn(`Player ${walletAddress} attempted to start craft without a pilot. Operation blocked.`, logContext);

        return {success: false, error: 'Crafting requires an active pilot.'};
    }

    const blueprintData = getBlueprint(blueprintKey);
    if (!blueprintData) {
        logger.error(`Invalid blueprintKey`, logContext);
        return {success: false, error: 'Invalid blueprintKey'};
    }

    const resourceCheckResult = await checkBlueprintResources(blueprintData, itemToCraftQuantity, walletAddress);

    if (!resourceCheckResult.success) {
        return resourceCheckResult;
    }

    const {requiredResources, timetocraft} = blueprintData;

    const session = await mongoose.startSession();
    try {
        let lockResult;
        await session.withTransaction(async () => {

            await deductResources(session, walletAddress, requiredResources, itemToCraftQuantity);

            lockResult = await lockCraftingSlot(session, walletAddress, blueprintKey, itemToCraftQuantity, timetocraft)
        });

        return {
            success: true,
            message: 'Success! Manufacturing started',
            data: lockResult.data
        };
    } catch (error) {
        const errorMessage = error.message || 'Unknown error during transaction';
        logger.error(`Transaction failed for craft ${blueprintKey} by ${walletAddress}: ${errorMessage}`, logContext);
        return {success: false, error: errorMessage};
    } finally {
        session.endSession();
    }
}

async function finishCraft(payload, walletAddress) {
    walletAddress = walletAddress?.toLowerCase();
    const logContext = `${walletAddress}`;

    const {factoryUid, factoryName} = payload;

    const session = await mongoose.startSession();
    try {
        let finalResult;

        await session.withTransaction(async () => {

            const factoryDoc = await Factory.findOne({walletAddress}).session(session);
            if (!factoryDoc || !factoryDoc.factories || !factoryDoc.factories[factoryName]) {
                throw new Error(`Factory slot ${factoryName} not found for user.`);
            }
            const slot = factoryDoc.factories[factoryName];

            if (slot.factoryUid !== factoryUid) {
                throw new Error(`Factory UID mismatch. Expected ${slot.factoryUid}, got ${factoryUid}.`);
            }
            if (slot.state !== 'crafting') {
                throw new Error(`Factory is not in 'crafting' state. Current state: ${slot.state}.`);
            }
            if (slot.endTime > Date.now()) {
                throw new Error(`Crafting is not yet complete. Ends at ${new Date(slot.endTime).toISOString()}.`);
            }

            const {blueprintKey, quantity} = slot;
            const blueprintData = getBlueprint(blueprintKey);
            if (!blueprintData) {

                throw new Error(`Blueprint data not found in catalog for key: ${blueprintKey}`);
            }

            let craftedItemData;

            logger.debug(`Crafting ${quantity} of ${blueprintKey} (${blueprintData.subcategory}) for ${walletAddress}`, `craft_${walletAddress}`);
            if (blueprintData.subcategory === 'components' || blueprintData.subcategory === 'hulls' || blueprintData.subcategory === 'other') {
                const componentResult = await createComponent(blueprintData, quantity);
                if (!componentResult.success) {
                    throw new Error(`Component/Hull creation failed: ${componentResult.error}`);
                }

                const {key, quantity: itemQuantity, category} = componentResult.data;

                const fieldToUpdate = category;

                await Inventory.updateOne(
                    {walletAddress},
                    {$inc: {[`${fieldToUpdate}.${key}.quantity`]: itemQuantity}},
                    {session, upsert: true}
                );
                craftedItemData = {key, quantity: itemQuantity, category};

                if (craftedItemData.category === 'hulls') {
                    logCraftAttempt('ITEM_CRAFTED', {
                        walletAddress: walletAddress,
                        details: {
                            itemKey: craftedItemData.key,
                            category: craftedItemData.category,
                            quantity: craftedItemData.quantity,
                            source: "factory",
                            factoryName: factoryName
                        }
                    });
                }

            } else if (blueprintData.subcategory === 'modules') {

                const moduleResult = await createModule(blueprintData, quantity);
                if (!moduleResult.success) {
                    throw new Error(`Module creation failed: ${moduleResult.error}`);
                }

                const {key, quantity: itemQuantity, category, craftedModules} = moduleResult.data;

                const bulkOps = craftedModules.map(module => ({
                    updateOne: {
                        filter: {walletAddress},

                        update: {
                            $set: {
                                [`modules.${module.uid}`]: {
                                    key: key,
                                    level: module.level,
                                    category: module.category,
                                    params: module.params,
                                    initialParams: module.initialParams
                                }
                            }
                        },
                        upsert: true
                    }
                }));

                if (bulkOps.length > 0) {
                    const bulkResult = await Inventory.bulkWrite(bulkOps, {session});
                    if (bulkResult.hasWriteErrors()) {
                        throw new Error(`Bulk write to inventory failed: ${JSON.stringify(bulkResult.getWriteErrors())}`);
                    }

                }

                craftedItemData = {key, quantity: itemQuantity, category, craftedModules};
            } else {

                throw new Error(`Unknown blueprint subcategory: ${blueprintData.subcategory}`);
            }

            const factoryUpdateResult = await Factory.updateOne(
                {walletAddress, [`factories.${factoryName}.factoryUid`]: factoryUid},
                {
                    $set: {
                        [`factories.${factoryName}.state`]: 'idle',
                        [`factories.${factoryName}.blueprintKey`]: null,
                        [`factories.${factoryName}.quantity`]: null,
                        [`factories.${factoryName}.endTime`]: null,
                        [`factories.${factoryName}.startTime`]: null,
                    }
                },
                {session}
            );

            if (factoryUpdateResult.modifiedCount === 0) {

                throw new Error('Failed to update factory state. It might have been modified by another process.');
            }

            finalResult = {
                success: true,
                data: {
                    factoryName,
                    state: 'idle',
                    craftedItem: craftedItemData
                }
            };
        });

        if (finalResult.success) {
            logger.debug(`[CRAFT] Finished successfully for ${walletAddress}. Data: ${JSON.stringify(finalResult.data)}`, logContext);
        }

        return finalResult;

    } catch (error) {

        const errorMessage = error.message || 'An unknown error occurred during the transaction.';
        logger.error(`[CRAFT] Transaction failed in finishCraft for ${walletAddress} (${factoryName}): ${errorMessage}`, logContext);
        return {success: false, error: 'Could not finish craft'};
    } finally {

        await session.endSession();
    }
}

module.exports = {startCraft, finishCraft};
const mongoose = require('mongoose');
const {deductResources} = require('../../inventory/inventory');
const {Ship} = require('../../ships/ships');
const logger = require('../../../core/logger');
const {deepClone, calculateModuleParams} = require('../upgradeUtils');

async function processUpgradeModuleInShip({
                                              shipId,
                                              moduleUid,
                                              moduleKey,
                                              moduleLevel,
                                              moduleType,
                                              upgradableParams,
                                              itemToUpgradeQuantity,
                                              requiredResources,
                                              upgradeParams,
                                              walletAddress,
                                              modulePath,
                                              slots,
                                          }) {
    walletAddress = walletAddress?.toLowerCase();
    const logContext = `${walletAddress}`;

    async function findModule(session) {
        const query = {
            shipId,
            $or: slots.map(slot => ({[`${modulePath}${slot !== 'module' ? `.${slot}` : ''}.module.uid`]: moduleUid}))
        };
        const projection = slots.reduce((acc, slot) => ({
            ...acc,
            [`${modulePath}${slot !== 'module' ? `.${slot}` : ''}`]: 1
        }), {});

        const ship = await Ship.findOne(query, projection, {session});
        if (!ship) {
            logger.error(`[UPGRADE-MODULE-SHIP] Upgrade failed: Module not found on specified ship.`, logContext);
            return {success: false, error: 'Module not found on specified ship.'};
        }

        const modKeyPath = modulePath.split('.')[1];
        let foundModuleInfo = null;
        for (const slot of slots) {
            const path = slot !== 'module' ? ship.modules?.[modKeyPath]?.[slot]?.module : ship.modules?.[modKeyPath]?.module;
            if (path?.uid === moduleUid) {
                foundModuleInfo = {moduleData: path, slotKey: slot};
                break;
            }
        }

        if (!foundModuleInfo) {
            logger.error(`[UPGRADE-MODULE-SHIP] Module logic error: module UID found but data path is incorrect`, logContext);
            return {success: false, error: `Module logic error: module UID found but data path is incorrect`};
        }

        return {success: true, ...foundModuleInfo};
    }

    const session = await mongoose.startSession({defaultTransactionOptions: {maxTimeMS: 10000}});
    try {
        let upgradedModule;
        await session.withTransaction(async () => {

            const moduleResult = await findModule(session);
            if (!moduleResult.success) {
                throw new Error(moduleResult.error);
            }
            const {moduleData, slotKey} = moduleResult;

            if (moduleData.key !== moduleKey || moduleData.level !== moduleLevel) {
                throw new Error(`Client data mismatch for UID ${moduleUid}. Client sent key:'${moduleKey}', level:${moduleLevel}. DB has key:'${moduleData.key}', level:${moduleData.level}.`);
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

            const basePath = slotKey !== 'module' ? `${modulePath}.${slotKey}.module` : `${modulePath}.module`;
            const updateFields = {
                [`${basePath}.level`]: moduleData.level + itemToUpgradeQuantity,
            };
            Object.entries(paramsResult.changedParams).forEach(([key, value]) => {
                updateFields[`${basePath}.params.${key}`] = value;
            });

            const updateResult = await Ship.updateOne(
                {shipId, [`${basePath}.uid`]: moduleUid},
                {$set: updateFields},
                {session}
            );

            if (updateResult.matchedCount === 0) {
                throw new Error('Failed to find document for update during transaction. Possible race condition.');
            }

            upgradedModule = {
                ...moduleData.toObject(),
                level: moduleData.level + itemToUpgradeQuantity,
                params: deepClone(paramsResult.params)
            };
        });

        return {success: true, upgradedShipId: shipId, module: upgradedModule};

    } catch (error) {
        logger.error(`[UPGRADE-MODULE-SHIP] Upgrade module:ship failure: ${error.message}\nStack: ${error.stack}`, logContext);
        return {success: false, error: `Upgrading failure!`};
    } finally {
        await session.endSession();
    }
}

module.exports = {processUpgradeModuleInShip};
const mongoose = require('mongoose');
const logger = require('../../../core/logger');
const {verifyShipOwnership, Ship} = require('../../ships/ships');
const {Inventory} = require('../../inventory/inventory');
const {getModule} = require('../../../catalog/catalog');

const SLOT_CONFIG = {
    'weapon1': {allowedTypes: ['weapon'], path: 'modules.weapons.weapon1'},
    'weapon2': {allowedTypes: ['weapon'], path: 'modules.weapons.weapon2'},
    'shield': {allowedTypes: ['shield'], path: 'modules.shield'},
    'armor': {allowedTypes: ['armor'], path: 'modules.armor'},
    'engine': {allowedTypes: ['engine'], path: 'modules.engine'},

};

async function installShipModule(payload, walletAddress) {
    walletAddress = walletAddress?.toLowerCase();
    const logContext = `${walletAddress}`;

    const {shipId, installingModuleUid, installingModuleKey, toSlot, slotUid, existingModuleUid} = payload;

    const validSlots = [
        'weapon1',
        'weapon2',
        'engine',
        'armor',
        'shield',

    ];

    const installingModuleCatalogData = getModule(installingModuleKey);
    if (!installingModuleCatalogData) {
        logger.error(`[INSTALL-MODULE-SHIP] Module with key '${installingModuleKey}' not found in catalog.`, logContext);
        return {success: false, error: `Installing module key '${installingModuleKey}' is invalid.`};
    }

    const installingModuleType = installingModuleCatalogData.type;
    if (!installingModuleType) {
        logger.error(`[INSTALL-MODULE-SHIP] No module type for ${installingModuleKey}`, logContext);
        return {success: false, error: `Server config error for module type '${installingModuleKey}'`};
    }

    const slotConfig = SLOT_CONFIG[toSlot];
    if (!slotConfig) {

        logger.error(`[INSTALL-MODULE-SHIP] No configuration found for slot: ${toSlot}`, logContext);
        return {success: false, error: 'Server configuration error for the specified slot.'};
    }

    if (!slotConfig.allowedTypes.includes(installingModuleType)) {
        logger.error(`[INSTALL-MODULE-SHIP] Module type '${installingModuleType}' cannot be installed in slot '${toSlot}'`, logContext);
        return {success: false, error: 'Module type not allowed in this slot.'};
    }

    const ownershipCheck = await verifyShipOwnership(shipId, walletAddress);
    if (!ownershipCheck.success) {
        logger.error(`[INSTALL-MODULE-SHIP] Ship ${shipId} ownership verification failed (Web3): ${ownershipCheck.error}`, logContext);
        return {success: false, error: ownershipCheck.error};
    }

    const operationType = existingModuleUid ? 'REPLACE' : 'INSTALL';
    logger.debug(`[INSTALL-MODULE-SHIP]: Preparing to ${operationType} module ${installingModuleKey} : ${installingModuleUid} in slot ${toSlot}. Starting transaction.`, logContext);

    const session = await mongoose.startSession({defaultTransactionOptions: {maxTimeMS: 10000}});
    try {
        let result;
        await session.withTransaction(async () => {

            const inventory = await Inventory.findOne(
                {walletAddress, [`modules.${installingModuleUid}`]: {$exists: true}},
                {[`modules.${installingModuleUid}`]: 1},
                {session, lean: true}
            );

            if (!inventory) {
                throw new Error(`Inventory (module) not found.`);
            }

            const moduleDataFromInventory = inventory?.modules?.[installingModuleUid];

            if (!moduleDataFromInventory || moduleDataFromInventory.key !== installingModuleKey) {
                throw new Error(`Installing module not found in inventory or key mismatch`);
            }

            const newModuleForShip = {
                ...moduleDataFromInventory,
                uid: installingModuleUid
            };

            const slotPath = slotConfig.path;
            const modulePath = `${slotPath}.module`;
            let shipUpdateFilter;

            if (operationType === 'INSTALL') {
                shipUpdateFilter = {
                    shipId,
                    [`${slotPath}.slotUid`]: slotUid,
                    [`${modulePath}.uid`]: null
                };
            } else {
                shipUpdateFilter = {
                    shipId,
                    [`${slotPath}.slotUid`]: slotUid,
                    [`${modulePath}.uid`]: existingModuleUid
                };
            }

            const shipUpdateOperation = {$set: {[modulePath]: newModuleForShip}};
            const inventoryUpdateOperation = {$unset: {[`modules.${installingModuleUid}`]: ''}};

            const [shipResult, inventoryResult] = await Promise.all([
                Ship.updateOne(shipUpdateFilter, shipUpdateOperation, {session}),
                Inventory.updateOne({
                    walletAddress,
                    [`modules.${installingModuleUid}`]: {$exists: true}
                }, inventoryUpdateOperation, {session})
            ]);

            if (shipResult.matchedCount === 0) {
                throw new Error(`Failed to update ship. The slot state has changed`);
            }
            if (inventoryResult.modifiedCount === 0) {
                throw new Error(`Failed to update inventory`);
            }

            result = {
                success: true,
                slotUpdated: {
                    uid: slotUid,
                    name: toSlot
                },
                shipUpdatedId: shipId,
                installedModule: newModuleForShip
            };
        });

        if (result.success) {
            logger.debug(`[INSTALL-MODULE-SHIP] Module ${installingModuleKey} installed!`, logContext);
        }

        return result;

    } catch (error) {
        logger.error(`[INSTALL-MODULE-SHIP] Transaction error: ${error.message}\nStack: ${error.stack}`, logContext);
        return {success: false, error: `Installing failure!`};
    } finally {
        await session.endSession();
    }
}

module.exports = {installShipModule};
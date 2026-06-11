const {processUpgradeModuleInShip} = require('./upgradeModule');
const logger = require('../../../core/logger');
const {verifyShipOwnership} = require('../../ships/ships');
const {getModule} = require('../../../catalog/catalog');
const {calculateRequiredResources} = require('../upgradeUtils');

const MODULE_CONFIG = {
    'weapon': {
        upgradableParams: ['damage.min', 'damage.max', 'critical.chance', 'critical.modifier'],
        modulePath: 'modules.weapons',
        slots: ['weapon1', 'weapon2'],
    },
    'shield': {
        upgradableParams: ['shield.capacity', 'shield.regen'],
        modulePath: 'modules.shield',
        slots: ['module'],
    },
    'armor': {
        upgradableParams: ['armor.capacity', 'absorption.chance', 'absorption.absorb'],
        modulePath: 'modules.armor',
        slots: ['module'],
    },
    'engine': {
        upgradableParams: ['energy.capacity', 'energy.regen', 'evasion'],
        modulePath: 'modules.engine',
        slots: ['module'],
    },
};

async function upgradeShipModule(payload, walletAddress) {
    walletAddress = walletAddress?.toLowerCase();
    const logContext = `${walletAddress}`;

    const {shipId, moduleUid, moduleKey, moduleLevel, itemToUpgradeQuantity} = payload;

    const moduleCatalogData = getModule(moduleKey);
    if (!moduleCatalogData) {
        logger.error(`[UPGRADE-MODULE-SHIP] Module with key '${moduleKey}' not found in catalog.`, logContext);
        return {success: false, error: `Module key '${moduleKey}' is invalid.`};
    }

    const moduleType = moduleCatalogData.type;
    const moduleConfig = MODULE_CONFIG[moduleType];
    if (!moduleConfig) {
        logger.error(`[UPGRADE-MODULE-SHIP] No server configuration found for module type '${moduleType}' (from key '${moduleKey}')`, logContext);
        return {success: false, error: `Server config error for module type '${moduleType}'.`};
    }

    const ownershipCheck = await verifyShipOwnership(shipId, walletAddress);
    if (!ownershipCheck.success) {
        logger.error(`[UPGRADE-MODULE-SHIP] Ship ${shipId} ownership verification failed (Web3): ${ownershipCheck.error}`, logContext);
        return {success: false, error: ownershipCheck.error};
    }

    const upgradeData = moduleCatalogData.upgrade;
    if (!upgradeData) {
        logger.error(`[UPGRADE-MODULE-SHIP] No upgrade data found for moduleKey: ${moduleKey}`, logContext);
        return {success: false, error: `No upgrade data found for module ${moduleKey}`};
    }

    const resourcesResult = calculateRequiredResources(moduleLevel, itemToUpgradeQuantity, upgradeData.materials);
    if (!resourcesResult.success) {
        logger.error(`[UPGRADE-MODULE-SHIP] Failed to calculate required resources for ${moduleKey}: ${resourcesResult.error}`, logContext);
        return {success: false, error: resourcesResult.error};
    }

    try {
        const upgradeResult = await processUpgradeModuleInShip({
            shipId,
            moduleUid,
            moduleKey,
            moduleLevel,
            moduleType,
            itemToUpgradeQuantity,
            requiredResources: resourcesResult.resources,
            upgradeParams: upgradeData.params,
            walletAddress,
            ...moduleConfig
        });

        if (upgradeResult.success) {
            logger.debug(`[UPGRADE-MODULE-SHIP] Upgrade success! RESULT:${JSON.stringify(upgradeResult)}`, logContext);
        }

        return upgradeResult;

    } catch (error) {
        logger.error(`[UPGRADE-MODULE-SHIP] Transaction error: ${error.message}\nStack: ${error.stack}`, logContext);
        return {success: false, error: `Upgrade module - server error!`};
    }
}

module.exports = {upgradeShipModule};
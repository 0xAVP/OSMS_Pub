const {processUpgradeInventoryModule} = require('./upgradeModule');
const logger = require('../../../core/logger');
const {getModule} = require('../../../catalog/catalog');
const {calculateRequiredResources} = require('../upgradeUtils');

const MODULE_CONFIG = {
    'weapon': {upgradableParams: ['damage.min', 'damage.max', 'critical.chance', 'critical.modifier']},
    'shield': {upgradableParams: ['shield.capacity', 'shield.regen']},
    'armor': {upgradableParams: ['armor.capacity', 'absorption.chance', 'absorption.absorb']},
    'engine': {upgradableParams: ['energy.capacity', 'energy.regen', 'evasion']},
};

async function upgradeInventoryModule(payload, walletAddress) {
    walletAddress = walletAddress?.toLowerCase()
    const logContext = `${walletAddress}`;

    const {moduleUid, moduleKey, moduleLevel, itemToUpgradeQuantity} = payload;

    try {

        const moduleCatalogData = getModule(moduleKey);
        if (!moduleCatalogData) {
            logger.error(`Module key '${moduleKey}' not found in catalog.`, logContext);
            return {success: false, error: `Catalog data not found for module key ${moduleKey}`};
        }
        const moduleType = moduleCatalogData.type;
        const upgradeData = moduleCatalogData.upgrade;
        if (!upgradeData) {
            logger.error(`No upgrade data in catalog for moduleKey: ${moduleKey}`, logContext);
            return {success: false, error: `No upgrade data found for module ${moduleKey}`};
        }

        const moduleConfig = MODULE_CONFIG[moduleType];
        if (!moduleConfig) {
            logger.error(`No upgrade config found for module type: ${moduleType}`, logContext);
            return {success: false, error: `No config for module type ${moduleType}`};
        }

        const resourcesResult = calculateRequiredResources(moduleLevel, itemToUpgradeQuantity, upgradeData.materials);
        if (!resourcesResult.success) {
            logger.error(`Failed to calculate required resources for ${moduleKey}: ${resourcesResult.error}`, logContext);
            return {success: false, error: resourcesResult.error};
        }

        const result = await processUpgradeInventoryModule({
            walletAddress,
            moduleUid,
            moduleKey,
            moduleLevel,
            moduleType,
            itemToUpgradeQuantity,
            upgradableParams: moduleConfig.upgradableParams,
            requiredResources: resourcesResult.resources,
            upgradeParams: upgradeData.params
        });

        if (result.success) {
            logger.debug(`[UPGRADE-MODULE-INVENTORY] Upgrade success! RESULT:${JSON.stringify(result)}`, logContext);
        }

        return result;

    } catch (error) {
        logger.error(`[UPGRADE-MODULE-INVENTORY] Transaction error: ${error.message}`);
        return {success: false, error: `Upgrade module - server error!`};
    }
}

module.exports = {upgradeInventoryModule};
import {findInventoryItem, calculateUpgradeRequiredResources} from '../actionUtils.js';
import {getCatalogData} from '../../wallet/catalog.js';

export function handleUpgrade(scene, item, quantity) {
    if (!item || !item.key || !item.uid) {
        console.error('UpgradeHandler: No valid item, item.key, or item.uid found');
        return {canUpgrade: false, error: 'Invalid item, key, or UID'};
    }

    const resources = calculateUpgradeRequiredResources(scene, item, quantity);
    const inventory = scene.inventoryItems || {};

    for (const resourceKey of Object.keys(resources)) {
        const resourceData = resources[resourceKey];
        const requiredAmount = resourceData.quantity;
        const availableAmount = findInventoryItem(scene, inventory, resourceKey);

        if (availableAmount < requiredAmount) {
            console.log('UpgradeHandler: Not enough materials');
            return {canUpgrade: false, reason: 'Not enough materials'};
        }
    }

    const upgradeDataPayload = {
        moduleUid: item.uid,
        moduleKey: item.key,
        moduleLevel: item.level,
        itemToUpgradeQuantity: quantity,
        canUpgrade: true
    };

    console.log('Upgrade attempt:', JSON.stringify(upgradeDataPayload, null, 2));
    return upgradeDataPayload;
}

/**
 * Запускает процесс улучшения модуля через ActionService.
 * @param {Phaser.Scene} scene - Экземпляр HangarScene.
 * @param {object} item - Объект модуля для улучшения.
 * @param {number} quantity - Количество уровней для улучшения.
 */
export async function startUpgrade(scene, item, quantity) {

    const upgradeData = handleUpgrade(scene, item, quantity);
    if (!upgradeData.canUpgrade) {
        const errorMsg = upgradeData.reason || 'Cannot upgrade module';
        scene.sysMessageContainer.addMessage(errorMsg, 'WARNING');

        throw new Error(errorMsg);
    }

    const payload = {
        moduleUid: upgradeData.moduleUid,
        moduleLevel: upgradeData.moduleLevel,
        moduleKey: upgradeData.moduleKey,
        itemToUpgradeQuantity: upgradeData.itemToUpgradeQuantity
    };

    return scene.actionService.execute({
        actionName: 'upgrade-module',
        payload: payload,
        messages: {
            start: `Upgrading ${item.name}...`,
            success: (response) => {
                const upgradedModule = response.module;
                const catalogData = getCatalogData(scene, upgradedModule.key, upgradedModule.category);
                const fullName = catalogData.name || upgradedModule.key;
                return `Module successfully upgraded: [color=#C4C6C8]${fullName}[/color]`;
            }
        },

        onSuccess: (response) => {

        }
    });
}

export function handleDismantle(scene, item) {
    if (!item || !item.key || !item.uid) {
        console.error('DismantleHandler: No valid item, key, or UID');
        return {canDismantle: false, error: 'Invalid item, key, or UID'};
    }

    const inventory = scene.inventoryItems || {};
    const module = inventory.modules?.[item.uid];

    if (!module) {
        console.error(`DismantleHandler: Module with UID ${item.uid} not found in inventory`);
        return {canDismantle: false, error: 'Module not found in inventory'};
    }
    if (module.category !== 'modules') {
        console.error(`DismantleHandler: Invalid module category`);
        return {canDismantle: false, error: 'Invalid module category'};
    }

    const dismantleDataPayload = {
        moduleUid: item.uid,
        canDismantle: true
    };

    console.log('Dismantle attempt:', JSON.stringify(dismantleDataPayload, null, 2));
    return dismantleDataPayload;
}

/**
 * Запускает процесс разборки модуля через ActionService.
 * @param {Phaser.Scene} scene - Экземпляр HangarScene.
 * @param {object} item - Объект модуля для разборки.
 */
export async function startDismantle(scene, item) {

    const dismantleData = handleDismantle(scene, item);
    if (!dismantleData.canDismantle) {
        const errorMsg = dismantleData.error || 'Cannot dismantle module';
        scene.sysMessageContainer.addMessage(errorMsg, 'ERROR');
        throw new Error(errorMsg);
    }

    const payload = {
        moduleUid: dismantleData.moduleUid,
        moduleKey: item.key
    };

    return scene.actionService.execute({
        actionName: 'dismantle-module',
        payload: payload,
        messages: {
            start: `Dismantling ${item.name}...`,
            success: (response) => {
                let resourceMessage = 'nothing';
                if (response.returnedResources && Object.keys(response.returnedResources).length > 0) {
                    resourceMessage = Object.entries(response.returnedResources)
                        .map(([key, resData]) => {
                            const resCatalog = getCatalogData(scene, key, resData.category);
                            return `${resCatalog.name || key} x${resData.quantity}`;
                        })
                        .join(', ');
                }
                return `Dismantled: [color=#C4C6C8]${item.name}.[/color] Received: ${resourceMessage}`;
            }
        }
    });
}


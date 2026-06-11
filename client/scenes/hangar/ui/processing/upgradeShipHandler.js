import {calculateUpgradeRequiredResources, findInventoryItem} from '../actionUtils.js';
import {getCatalogData} from "../../wallet/catalog";

/**
 * Проверяет, можно ли улучшить модуль, установленный на корабле.
 * Логика идентична handleUpgrade из upgradeHandler, но сохранена здесь для контекста.
 */
export function handleUpgrade(scene, item, quantity, shipId) {
    if (!item || !item.key || !item.uid) {
        console.error('ActionHandler: No valid item, item.key, or item.uid found');
        return {canUpgrade: false, error: 'Invalid item, key, or UID'};
    }

    if (!Number.isInteger(shipId) || shipId < 0) {
        console.error('ActionHandler: No valid shipId provided');
        return {canUpgrade: false, error: 'Invalid ship ID'};
    }
    const resources = calculateUpgradeRequiredResources(scene, item, quantity);
    const inventory = scene.inventoryItems || {};

    for (const resourceKey of Object.keys(resources)) {
        const resourceData = resources[resourceKey];
        const requiredAmount = resourceData.quantity;
        const availableAmount = findInventoryItem(scene, inventory, resourceKey);
        if (availableAmount < requiredAmount) {
            console.warn('ActionHandler: Not enough materials');
            return {canUpgrade: false, reason: 'Not enough materials'};
        }
    }

    return {
        moduleUid: item.uid,
        moduleKey: item.key,
        moduleLevel: item.level,
        itemToUpgradeQuantity: quantity,
        shipId: shipId,
        canUpgrade: true
    };
}

/**
 * Запускает процесс улучшения модуля, УСТАНОВЛЕННОГО НА КОРАБЛЕ, через ActionService.
 */
export async function startUpgrade(scene, item, quantity, shipId) {

    const upgradeData = handleUpgrade(scene, item, quantity, shipId);
    if (!upgradeData.canUpgrade) {
        const errorMsg = upgradeData.reason || upgradeData.error || 'Cannot initialize upgrade';
        scene.sysMessageContainer.addMessage(errorMsg, 'WARNING');
        throw new Error(errorMsg);
    }

    const clientSideCost = calculateUpgradeRequiredResources(scene, item, quantity);
    console.warn('[CLIENT-SIDE COST CALCULATION]', JSON.parse(JSON.stringify(clientSideCost)));

    const payload = {
        moduleKey: upgradeData.moduleKey,
        moduleUid: upgradeData.moduleUid,
        moduleLevel: upgradeData.moduleLevel,
        itemToUpgradeQuantity: upgradeData.itemToUpgradeQuantity,
        shipId: upgradeData.shipId
    };

    return scene.actionService.execute({
        actionName: 'upgrade-ship-module',
        payload: payload,
        messages: {
            start: `Upgrading ${item.name}...`,
            success: (response) => {
                const upgradedModule = response.module;
                const catalogData = getCatalogData(scene, upgradedModule.key, upgradedModule.category);
                return `Module successfully upgraded: [color=#C4C6C8]${catalogData.name || upgradedModule.key}[/color]`;
            }
        },
        onSuccess: (response) => {
            const upgradedModule = response.module;
            const moduleCatalogData = getCatalogData(scene, upgradedModule.key, upgradedModule.category);
            const upgradedItemFullData = {...upgradedModule, ...moduleCatalogData};

            const targetShip = scene.ships.find(s => s.shipId === shipId);
            let updatedSlotName = null;
            if (targetShip) {

                switch (upgradedItemFullData.type) {
                    case 'shield':
                        if (targetShip.modules.shield?.module.uid === upgradedModule.uid) {
                            targetShip.modules.shield.module = upgradedModule;
                            updatedSlotName = 'shield';
                        }
                        break;
                    case 'armor':
                        if (targetShip.modules.armor?.module.uid === upgradedModule.uid) {
                            targetShip.modules.armor.module = upgradedModule;
                            updatedSlotName = 'armor';
                        }
                        break;
                    case 'engine':
                        if (targetShip.modules.engine?.module.uid === upgradedModule.uid) {
                            targetShip.modules.engine.module = upgradedModule;
                            updatedSlotName = 'engine';
                        }
                        break;
                    case 'weapon':
                        if (targetShip.modules.weapons?.weapon1?.module.uid === upgradedModule.uid) {
                            targetShip.modules.weapons.weapon1.module = upgradedModule;
                            updatedSlotName = 'weapon1';
                        } else if (targetShip.modules.weapons?.weapon2?.module.uid === upgradedModule.uid) {
                            targetShip.modules.weapons.weapon2.module = upgradedModule;
                            updatedSlotName = 'weapon2';
                        }
                        break;
                    case 'extra':
                        if (targetShip.modules.extra?.extra1?.module.uid === upgradedModule.uid) {
                            targetShip.modules.extra.extra1.module = upgradedModule;
                            updatedSlotName = 'extra1';
                        } else if (targetShip.modules.extra?.extra2?.module.uid === upgradedModule.uid) {
                            targetShip.modules.extra.extra2.module = upgradedModule;
                            updatedSlotName = 'extra2';
                        }
                        break;
                }
            }

            scene.events.emit('moduleInShipUpgraded', {
                oldModule: item,
                newModule: upgradedItemFullData,
                shipUpdatedId: shipId,
                toSlot: updatedSlotName
            });
        }
    });
}

/**
 * Запускает процесс установки модуля на корабль через ActionService.
 */
export async function startModuleInstall(scene, shipId, installingModuleUid, installingModuleKey, toSlot, slotUid, existingModuleUid) {

    if (!Number.isInteger(shipId) || shipId < 0 || !installingModuleUid || !installingModuleKey || !toSlot || !slotUid) {
        const errorMsg = 'Invalid input module data';
        scene.sysMessageContainer.addMessage(errorMsg, 'ERROR');
        throw new Error(errorMsg);
    }

    const payload = {
        shipId: shipId,
        installingModuleUid: installingModuleUid,
        installingModuleKey: installingModuleKey,
        toSlot: toSlot,
        slotUid: slotUid,
        existingModuleUid: existingModuleUid || null
    };

    return scene.actionService.execute({
        actionName: 'install-ship-module',
        payload: payload,
        refreshInventoryOnSuccess: true,
        messages: {
            start: 'Installing module...',
            success: (response) => {
                const installedModule = response.installedModule;
                const catalogData = getCatalogData(scene, installedModule.key, installedModule.category);
                return `Module successfully installed: [color=#C4C6C8]${catalogData.name || installedModule.key}[/color]`;
            }
        },
        onSuccess: (response) => {
            const installedModule = response.installedModule;
            const moduleCatalogData = getCatalogData(scene, installedModule.key, installedModule.category);
            const installedModuleFullData = {...installedModule, ...moduleCatalogData};

            const shipUpdatedId = response.shipUpdatedId;
            const shipIndex = scene.ships?.findIndex(s => s.shipId === shipUpdatedId);
            if (shipIndex === -1 || !scene.ships) {
                console.error(`Ship not found for shipId: ${shipUpdatedId}`);
                return;
            }
            const targetShip = scene.ships[shipIndex];
            const updatedSlotName = response.slotUpdated.name;

            switch (updatedSlotName) {
                case 'weapon1':
                    if (targetShip.modules.weapons?.weapon1) {
                        targetShip.modules.weapons.weapon1.module = installedModule;
                    }
                    break;
                case 'weapon2':
                    if (targetShip.modules.weapons?.weapon2) {
                        targetShip.modules.weapons.weapon2.module = installedModule;
                    }
                    break;
                case 'shield':
                    if (targetShip.modules.shield) {
                        targetShip.modules.shield.module = installedModule;
                    }
                    break;
                case 'armor':
                    if (targetShip.modules.armor) {
                        targetShip.modules.armor.module = installedModule;
                    }
                    break;
                case 'engine':
                    if (targetShip.modules.engine) {
                        targetShip.modules.engine.module = installedModule;
                    }
                    break;
                case 'extra1':
                    if (targetShip.modules.extra?.extra1) {
                        targetShip.modules.extra.extra1.module = installedModule;
                    }
                    break;
                case 'extra2':
                    if (targetShip.modules.extra?.extra2) {
                        targetShip.modules.extra.extra2.module = installedModule;
                    }
                    break;
            }

            scene.events.emit('moduleInShipInstalled', {
                newModuleInstalled: installedModuleFullData,
                shipUpdatedId: shipUpdatedId,
                toSlot: updatedSlotName
            });
        }
    });
}


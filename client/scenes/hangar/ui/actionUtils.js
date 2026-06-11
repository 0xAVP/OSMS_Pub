import {getCatalogData} from "../wallet/catalog";

export function collectAllItems(scene) {
    const allItems = [];
    if (!scene.inventoryItems) return allItems;
    const categories = ['resources', 'components', 'blueprints', 'modules', 'hulls', 'stagestones', 'other'];
    categories.forEach(category => {
        const categoryData = scene.inventoryItems[category];
        if (categoryData) {
            Object.entries(categoryData).forEach(([entryKey, entryData]) => {
                let itemObject;
                if (category === 'modules') {
                    const keyForCatalog = entryData.key;
                    const catalogData = getCatalogData(scene, keyForCatalog, category);
                    itemObject = {...catalogData, ...entryData, uid: entryKey, category};
                } else {
                    const keyForCatalog = entryKey;
                    const catalogData = getCatalogData(scene, keyForCatalog, category);
                    itemObject = {...catalogData, ...entryData, key: keyForCatalog, category};
                    if (category === 'blueprints' && catalogData.itemCrafted) {
                        const itemCraftedKey = Object.keys(catalogData.itemCrafted)[0];
                        const meta = catalogData.itemCrafted[itemCraftedKey];
                        const fullCraftedInfo = getCatalogData(scene, itemCraftedKey, meta.category);
                        catalogData.itemCrafted[itemCraftedKey] = {...meta, ...fullCraftedInfo};
                    }
                }
                if (itemObject) allItems.push(itemObject);
            });
        }
    });
    return allItems;
}

export function findInventoryItem(scene, inventory, key) {
    if (!inventory || !key) {
        console.warn(`findInventoryItem: Invalid inventory or key provided.`);
        return 0;
    }

    if (Array.isArray(inventory)) {
        for (const item of inventory) {
            if (typeof item === 'object' && item !== null) {
                if (item.key === key && 'quantity' in item && typeof item.quantity === 'number') {
                    return item.quantity;
                }
                const found = findInventoryItem(scene, item, key);
                if (found > 0) return found;
            }
        }
    } else if (typeof inventory === 'object') {
        if (inventory[key] && 'quantity' in inventory[key] && typeof inventory[key].quantity === 'number') {
            return inventory[key].quantity;
        }
        for (const subKey in inventory) {
            if (typeof inventory[subKey] === 'object' && inventory[subKey] !== null) {
                const found = findInventoryItem(scene, inventory[subKey], key);
                if (found > 0) return found;
            }
        }
    }

    return 0;
}

export function updateInventoryLocally(scene, itemsToUpdate) {
    if (!Array.isArray(itemsToUpdate) || itemsToUpdate.length === 0) {
        console.warn(`updateInventoryLocally: Expected a non-empty array of items to update.`);
        return;
    }

    let itemsWereUpdated = false;

    for (const itemUpdate of itemsToUpdate) {
        const {itemId, category, quantityToDecrement} = itemUpdate;

        if (!itemId || !category || !quantityToDecrement) {
            console.warn('updateInventoryLocally: Skipping malformed item in update array.', itemUpdate);
            continue;
        }

        if (!scene.inventoryItems || !scene.inventoryItems[category] || !scene.inventoryItems[category][itemId]) {
            console.warn(`Item ${itemId} not found in local inventory cache for category ${category}. Cannot update locally.`);
            continue;
        }

        const item = scene.inventoryItems[category][itemId];

        if (item.quantity > quantityToDecrement) {
            item.quantity -= quantityToDecrement;
        } else {
            delete scene.inventoryItems[category][itemId];
        }

        itemsWereUpdated = true;
        console.log(`Inventory cache updated locally: removed ${quantityToDecrement}x ${itemId}.`);
    }

    if (itemsWereUpdated) {
        scene.events.emit('inventory-updated');
        console.log(`"inventory-updated" event emitted after batch update.`);
    }
}

export function calculateUpgradeRequiredResources(scene, currentModule, quantity) {
    if (!currentModule || !currentModule.key) {
        console.warn('Invalid module for resource calculation');
        return {};
    }
    const upgradeData = scene.catalog.modules?.[currentModule.key]?.upgrade;
    if (!upgradeData || !upgradeData.materials) {
        return {};
    }
    const requiredItems = upgradeData.materials;

    const fractionalResources = new Map();

    const a = upgradeData.a || 1;
    const b = upgradeData.b || 0.1;
    const c = upgradeData.c || 1.05;
    const currentLevel = currentModule.level || 1;

    for (let i = currentLevel + 1; i <= currentLevel + quantity; i++) {

        const multiplier = (a + b * (i - 1)) * Math.pow(c, i - 1);

        Object.entries(requiredItems).forEach(([resourceKey, resourceData]) => {
            if (!Number.isFinite(resourceData.quantity) || !resourceData.category) {
                console.warn(`Invalid resource data for ${resourceKey} in upgrade materials.`);
                return;
            }

            const amount = resourceData.quantity * multiplier;
            fractionalResources.set(resourceKey, (fractionalResources.get(resourceKey) || 0) + amount);
        });
    }

    const finalResources = {};
    for (const [resourceKey, totalAmount] of fractionalResources.entries()) {
        finalResources[resourceKey] = {
            quantity: Math.ceil(totalAmount),
            category: requiredItems[resourceKey].category
        };
    }
    return finalResources;
}

/**
 * Рассчитывает максимальное количество уровней, на которое можно улучшить модуль.
 * @param {Phaser.Scene} scene - Экземпляр сцены.
 * @param {object} item - Объект модуля для проверки.
 * @returns {number} - Максимальное количество уровней для апгрейда.
 */
export function calculateMaxUpgradeAmount(scene, item) {
    if (!item || !item.key) return 0;
    let maxLevelsCanAfford = 0;
    for (let i = 1; i < 100; i++) {
        const cumulativeCostResources = calculateUpgradeRequiredResources(scene, item, i);
        if (Object.keys(cumulativeCostResources).length === 0) {
            maxLevelsCanAfford = i;
            continue;
        }
        let canAffordThisCumulativeCost = true;
        for (const resourceKey in cumulativeCostResources) {
            const resource = cumulativeCostResources[resourceKey];
            const inventoryAmount = findInventoryItem(scene, scene.inventoryItems, resourceKey);
            if (inventoryAmount < resource.quantity) {
                canAffordThisCumulativeCost = false;
                break;
            }
        }
        if (canAffordThisCumulativeCost) {
            maxLevelsCanAfford = i;
        } else {
            break;
        }
    }
    return maxLevelsCanAfford;
}
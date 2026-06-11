import {findInventoryItem} from '../actionUtils.js';
import {getCatalogData} from '../../wallet/catalog.js';

export function handleCraft(scene, item, quantity) {

    if (!item || !item.key) {
        console.error('CraftHandler: No valid item or item.key found');
        return {canCraft: false, error: 'Invalid item or item.key'};
    }

    let freeFactory = null;
    if (scene.craftFactories) {
        freeFactory = Object.keys(scene.craftFactories).find(
            factoryName => scene.craftFactories[factoryName].state === 'idle'
        );
    }

    if (!freeFactory) {
        return {canCraft: false, reason: 'No free factories available'};
    }

    const requiredItems = item.requiredResources || {};
    const inventory = scene.inventoryItems || {};

    for (const [itemKey, itemData] of Object.entries(requiredItems)) {
        const requiredAmount = itemData.quantity * quantity;
        const availableAmount = findInventoryItem(scene, inventory, itemKey);
        if (availableAmount < requiredAmount) {
            return {canCraft: false, reason: 'Not enough materials'};
        }
    }

    const craftData = {
        blueprintKey: item.key,
        itemToCraftQuantity: quantity,
        canCraft: true
    };

    console.log('Craft attempt:', JSON.stringify(craftData, null, 2));

    return craftData;
}

export async function startCraft(scene, item, quantity) {

    const craftData = handleCraft(scene, item, quantity);
    if (!craftData.canCraft) {
        scene.sysMessageContainer.addMessage(craftData.reason || 'Cannot craft item', 'WARNING');
        throw new Error(craftData.reason || 'Cannot craft item');
    }

    const payload = {
        blueprintKey: craftData.blueprintKey,
        itemToCraftQuantity: craftData.itemToCraftQuantity
    };

    return scene.actionService.execute({
        actionName: 'start-craft',
        payload: payload,
        refreshInventoryOnSuccess: true,
        messages: {
            start: `Starting production of ${item.name}...`,
            success: `Production has begun: [color=#e0e0e0]${item.name}[/color]`
        },
        onSuccess: (response) => {

            if (response.data && typeof response.data === 'object') {
                scene.craftFactories = {...scene.craftFactories, ...response.data};

                Object.keys(response.data).forEach(factoryKey => {
                    scene.events.emit('factory-updated', {
                        factoryKey: factoryKey,
                        factoryData: response.data[factoryKey]
                    });
                });
            }
        }
    });
}

export async function cancelCraft(scene, factoryName, factoryUid) {
    const payload = {factoryName, factoryUid};

    return scene.actionService.execute({
        actionName: 'cancel-craft',
        payload: payload,
        refreshInventoryOnSuccess: false,
        messages: {
            start: `Cancelling production at ${factoryName}...`,
            success: `Production cancelled: ${factoryName}`
        },
        onSuccess: (response) => {

            if (response[factoryName]) {
                const newData = response[factoryName];
                scene.craftFactories[factoryName] = newData;
                scene.events.emit('factory-updated', {
                    factoryKey: factoryName,
                    factoryData: newData
                });
            }
        }
    });
}

export async function finishCraft(scene, factoryName, factoryUid) {
    const payload = {factoryName, factoryUid};

    return scene.actionService.execute({
        actionName: 'finish-craft',
        payload: payload,
        refreshInventoryOnSuccess: true,
        messages: {
            start: `Collecting from ${factoryName}...`,
            success: (response) => {
                const responseData = response.data;
                const craftedItem = responseData?.craftedItem;
                if (!craftedItem) return 'Production completed!';

                const itemName = getCatalogData(scene, craftedItem.key, craftedItem.category)?.name;
                return `Production completed: [color=#C4C6C8]${itemName || craftedItem.key} x${craftedItem.quantity}[/color]`;
            }
        },
        onSuccess: (response) => {

            const responseData = response.data;
            if (responseData) {
                const newData = {
                    state: responseData.state,
                    blueprintKey: null,
                    quantity: null,
                    endTime: null,
                    startTime: null,
                    factoryUid: null
                };
                scene.craftFactories[factoryName] = newData;
                scene.events.emit('factory-updated', {
                    factoryKey: factoryName,
                    factoryData: newData
                });
            }
        }
    });
}


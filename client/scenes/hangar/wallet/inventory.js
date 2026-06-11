import {webSocketManager} from '../WebSocketManager.js';

/**
 * Устанавливает инвентарь и ГЕНЕРИРУЕТ СОБЫТИЕ.
 * @param {object} data - Полный объект инвентаря.
 */
function setFullInventory(data) {
    this.inventoryItems = data;

    this.events.emit('inventory-updated');
    console.log('Inventory set. Emitted "inventory-updated" event.');
}

export function setActualExp(data) {
    this.actualExp = data;

    this.events.emit('exp-updated', data);
    console.log('Exp set. Emitted "exp-updated" event.');
    console.log(`Expected.${data}`);
}

/**
 * Обновляет локальный кэш инвентаря и ГЕНЕРИРУЕТ СОБЫТИЕ.
 * @param {Array} itemsToAdd - Массив предметов для добавления.
 */
export function updateInventoryCacheWithItems(itemsToAdd) {
    const scene = this;

    if (!itemsToAdd || itemsToAdd.length === 0) return;
    if (!scene.inventoryItems) {
        console.warn('Inventory cache (scene.inventoryItems) not initialized. Cannot update.');
        return;
    }

    for (const item of itemsToAdd) {
        const {itemUid, itemKey, category, data} = item;

        if (!scene.inventoryItems[category]) {
            scene.inventoryItems[category] = {};
        }

        if (category === 'modules') {
            if (itemUid && data) {
                scene.inventoryItems.modules[itemUid] = data;
            }
        } else {
            if (itemKey && data?.quantity) {
                const currentItem = scene.inventoryItems[category][itemKey];
                const currentQuantity = currentItem?.quantity || 0;
                scene.inventoryItems[category][itemKey] = {quantity: currentQuantity + data.quantity};
            }
        }
    }

    this.events.emit('inventory-updated');
    console.log('Inventory cache updated locally. Emitted "inventory-updated" event.');
}

export async function getInventory() {
    try {
        console.log('Requesting inventory...');
        const data = await webSocketManager.sendMessage('get-inventory');

        if (!data) {
            console.error('Failed to load inventory: No data received');
            setFullInventory.call(this, null);
            return null;
        }
        setFullInventory.call(this, data.inventory);
        console.log('Inventory received:', data.inventory);
        return data.inventory;
    } catch (error) {
        console.error('Error fetching inventory items:', error.message);
        setFullInventory.call(this, null);
        return null;
    }
}

export async function getShips() {
    try {
        console.log('Requesting ships...');
        const data = await webSocketManager.sendMessage('get-ships');

        if (!data) {
            const errorMsg = 'Failed to load ships: No data in response';
            console.error(errorMsg);
            this.ships = [];
            throw new Error(errorMsg);
        }

        const shipList = data.allPlayerShips || [];
        this.ships = shipList;
        if (shipList.length > 0) {
            const lastUsedShip = shipList.find(s => s.shipId === this.lastUsedShipId);
            this.selectedShip = lastUsedShip || shipList[0];
            console.log('Selected ship:', this.selectedShip);
        }
        console.log('Ship list received:', shipList);
        return shipList;
    } catch (error) {
        console.error('Error fetching ships:', error.message);
        this.ships = [];
        throw error;
    }
}

export async function getActualExp() {
    try {
        console.log('Requesting actual exp...');
        const data = await webSocketManager.sendMessage('get-actual-exp');

        if (!data) {
            console.error('Failed to load exp: No data received');
            setActualExp.call(this, 0);
            return null;
        }
        setActualExp.call(this, data.exp);
        console.log('Actual exp received:', data.exp);
        return data.exp;
    } catch (error) {
        console.error('Error fetching actual exp:', error.message);
        setActualExp.call(this, 0);
        return null;
    }
}
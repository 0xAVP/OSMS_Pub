import {webSocketManager} from '../WebSocketManager.js';

/**
 * Запрашивает и обновляет данные о фабриках.
 * 'this' - это контекст сцены.
 */

export async function refreshFactories() {
    try {
        console.log('Requesting factories data...');
        const data = await webSocketManager.sendMessage('get-factories');

        if (!data) {
            console.error('Failed to load factories data: No data received.');

            return null;
        }

        this.craftFactories = data.factories;

        this.events.emit('factoriesUpdated');
        console.log('Factories data refreshed:', data.factories);
        return data.factories;
    } catch (error) {
        console.error('Error refreshing factories data:', error.message);
        return null;
    }
}
import {webSocketManager} from '../WebSocketManager.js';

/**
 * Запрашивает и обновляет активные баффы в реестре.
 * 'this' - это контекст сцены.
 */

export async function refreshActiveBuffs() {
    try {
        const data = await webSocketManager.sendMessage('get-active-buffs');

        if (data && typeof data.buffs === 'object') {
            this.registry.set('active_buffs', data.buffs);
            console.log('Active buffs refreshed and set to Registry:', data.buffs);

            this.events.emit('buffs-updated');
            return data.buffs;
        } else {

            console.error('Failed to refresh active buffs:', data.error || 'No data received');
            return null;
        }
    } catch (error) {
        console.error('Error refreshing active buffs:', error.message);
        return null;
    }
}
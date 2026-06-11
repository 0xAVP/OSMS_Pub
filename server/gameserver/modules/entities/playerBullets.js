const WebSocket = require('ws');
const {safeSend} = require('../../utils/networkUtils');
const {MK, MT} = require('../../core/gameStateKeys');

/**
 * Проверяет, может ли игрок совершить выстрел (проверка энергии, кулдаунов).
 * НЕ создает сущностей. Возвращает true/false.
 * @param {object} session - Игровая сессия.
 * @param {object} action - Действие выстрела.
 * @param {WebSocket} ws - WebSocket соединение.
 * @returns {boolean} - true, если выстрел валиден, иначе false.
 */
function validatePlayerFireAction(session, action, ws) {
    const now = Date.now();
    const cm = session.componentManager;
    const playerEntityId = session.playerEntityId;

    const playerEnergy = cm.getComponent(playerEntityId, 'energy');
    const playerCooldowns = cm.getComponent(playerEntityId, 'cooldowns');
    const playerInventory = cm.getComponent(playerEntityId, 'weapon_inventory');

    if (!playerEnergy || !playerCooldowns || !playerInventory) {
        return false;
    }

    const activeSlot = playerInventory.activeSlot;
    const activeWeaponData = playerInventory.weapons[activeSlot];
    if (!activeWeaponData || !activeWeaponData.params) {
        return false;
    }
    const weaponParams = activeWeaponData.params;

    const fireRate = weaponParams.fireRate;
    if (now - playerCooldowns.lastFireTime < fireRate - 1) {
        safeSend(ws, {
            [MK.TYPE]: MT.FIRE_REJECTED,
            [MK.PAYLOAD]: {reason: 'invalid fire rate'}
        });
        return false;
    }

    const energyCost = weaponParams.energyCost;
    if (playerEnergy.current < energyCost) {
        safeSend(ws, {
            [MK.TYPE]: MT.FIRE_REJECTED,
            [MK.PAYLOAD]: {reason: 'insufficient energy'}
        });
        return false;
    }

    playerEnergy.current -= energyCost;
    playerCooldowns.lastFireTime = action.timestamp;

    return true;
}

module.exports = {validatePlayerFireAction};
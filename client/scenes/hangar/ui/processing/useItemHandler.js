import {getBuffDefinition} from '../../../shared/BuffService.js';
import {updateInventoryLocally} from "../actionUtils";

/**
 * Отправляет на сервер запрос на использование предмета через ActionService.
 * @param {Phaser.Scene} scene - Текущая сцена.
 * @param {object} item - Полный объект используемого предмета.
 * @returns {Promise<object>} - Promise, который разрешается с ответом от сервера.
 */
export async function useItem(scene, item) {

    if (!item || !item.key || !item.category) {
        const errorMsg = 'Invalid item data provided for use.';
        scene.sysMessageContainer.addMessage(errorMsg, 'ERROR');
        throw new Error(errorMsg);
    }

    const payload = {
        itemId: item.key
    };

    return scene.actionService.execute({
        actionName: 'use-item',
        payload: payload,
        refreshInventoryOnSuccess: false,
        messages: {
            start: `Using ${item.name || item.key}...`,

            success: (response) => {
                if (response.buff) {
                    const buffDef = getBuffDefinition(scene, response.buff.buffId);
                    if (buffDef) {
                        const buffName = buffDef.name || (buffDef.group ? buffDef.group.replace('_', ' ') : 'Buff');
                        return `Activated buff: [color=#41C6FF]${buffName}[/color]`;
                    }
                }
                return `Used ${item.name || item.key} successfully.`;
            }
        },
        onSuccess: (response) => {

            updateInventoryLocally(scene, [{
                itemId: item.key,
                category: item.category,
                quantityToDecrement: 1
            }]);

            if (response.buff) {
                const newBuff = response.buff;
                const currentBuffs = scene.registry.get('active_buffs') || {};
                const updatedBuffs = {...currentBuffs};
                const buffDef = getBuffDefinition(scene, newBuff.buffId);

                if (buffDef && !buffDef.isStackable) {
                    for (const existingBuffId in updatedBuffs) {
                        const existingBuffDef = getBuffDefinition(scene, existingBuffId);
                        if (existingBuffDef && existingBuffDef.group === buffDef.group) {
                            delete updatedBuffs[existingBuffId];
                        }
                    }
                }

                updatedBuffs[newBuff.buffId] = newBuff;
                scene.registry.set('active_buffs', updatedBuffs);
                scene.events.emit('buffs-updated');
            }
        }
    });
}


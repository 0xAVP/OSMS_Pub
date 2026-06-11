import {checkSession, isSessionFreshEnoughForAction} from '../../session.js';

import {webSocketManager} from '../../WebSocketManager.js';
import {getInventory} from '../../wallet/inventory.js';

/**
 * @class ActionService
 * @description Централизованный сервис для выполнения асинхронных действий в ангаре.
 * Инкапсулирует общую логику: проверка сессии, отправка WS-сообщения,
 * обработка ошибок и обратная связь с пользователем.
 */
export class ActionService {
    /**
     * @param {Phaser.Scene} scene - Экземпляр HangarScene.
     */
    constructor(scene) {
        if (!scene) {
            throw new Error('ActionService requires a Phaser.Scene instance.');
        }
        this.scene = scene;
    }

    /**
     * Универсальный метод для выполнения действия.
     * @param {object} config - Конфигурация действия.
     * @param {string} config.actionName - Имя события для WebSocket (например, 'upgrade-module').
     * @param {object} config.payload - Данные для отправки на сервер.
     * @param {object} [config.messages] - Сообщения для пользователя.
     * @param {string} [config.messages.start] - Сообщение в начале выполнения.
     * @param {(response: any) => string} [config.messages.success] - Функция, генерирующая сообщение об успехе на основе ответа сервера.
     * @param {boolean} [config.refreshInventoryOnSuccess=true] - Нужно ли обновлять инвентарь после успешного выполнения.
     * @param {boolean} [config.requireFreshSession=false] - Требуется ли "свежая" подпись кошелька для этого действия.
     * @param {(response: any) => void} [config.onSuccess] - Дополнительный колбэк, который выполнится после успешного завершения.
     * @returns {Promise<any>} - Promise, который разрешается с данными от сервера в случае успеха.
     */
    async execute(config) {
        const {
            actionName,
            payload,
            messages = {},
            refreshInventoryOnSuccess = true,
            requireFreshSession = false,
            onSuccess
        } = config;

        try {

            const needsForceRefresh = requireFreshSession && !isSessionFreshEnoughForAction(this.scene).isFresh;
            const session = await checkSession(this.scene, {forceRefresh: needsForceRefresh});

            if (!session.isValid) {
                throw new Error(session.message || 'Session is invalid. Please reconnect.');
            }
        } catch (error) {
            this.scene.sysMessageContainer.addMessage(error.message, 'ERROR');
            throw error;
        }

        if (messages.start) {
            this.scene.sysMessageContainer.addMessage(messages.start, 'DEFAULT');
        }

        try {
            const response = await webSocketManager.sendMessage(actionName, payload);

            if (!response) {
                throw new Error('No data received from server');
            }

            if (messages.success) {
                const successMessage = typeof messages.success === 'function'
                    ? messages.success(response)
                    : messages.success;
                this.scene.sysMessageContainer.addMessage(successMessage, 'SUCCESS');
            }

            if (refreshInventoryOnSuccess) {
                await getInventory.call(this.scene);
            }

            if (onSuccess && typeof onSuccess === 'function') {
                onSuccess(response);
            }

            return response;

        } catch (error) {

            console.error(`ActionService: Error during '${actionName}' action:`, error.message);
            this.scene.sysMessageContainer.addMessage(`Action failed: ${error.message}`, 'ERROR');
            throw error;
        }
    }
}
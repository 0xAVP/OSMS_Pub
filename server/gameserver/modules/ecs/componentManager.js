const logger = require('../../core/logger');

const TAG_COMPONENTS = new Set([
    'enemy', 'minion', 'indestructible', 'oneshot', 'player_controlled',
    'pending_destruction', 'offscreen_ttl', 'spawn_request'
]);

class ComponentManager {
    constructor() {
        this.componentStores = new Map();
    }

    registerComponent(componentName) {
        if (!this.componentStores.has(componentName)) {
            this.componentStores.set(componentName, new Map());
        }
    }

    /**
     * Добавляет или обновляет компонент у сущности.
     * @param {number} entityId ID сущности.
     * @param {string} componentName Имя компонента.
     * @param {*} componentData Данные компонента. Не должны быть null или undefined.
     */
    addComponent(entityId, componentName, componentData) {

        if (componentData === null || componentData === undefined) {
            logger.error(`[ComponentManager] Попытка добавить невалидные данные (null/undefined) в компонент "${componentName}". Используйте removeComponent() для удаления.`);
            return;
        }

        const store = this.componentStores.get(componentName);
        if (!store) {
            logger.error(`[ComponentManager] Попытка добавить компонент в незарегистрированное хранилище: ${componentName}`);
            return;
        }

        store.set(entityId, componentData);
    }

    /**
     * Явно и безопасно удаляет компонент с сущности.
     * @param {number} entityId ID сущности.
     * @param {string} componentName Имя компонента.
     */
    removeComponent(entityId, componentName) {
        const store = this.componentStores.get(componentName);
        if (store) {
            store.delete(entityId);
        }
    }

    getComponent(entityId, componentName) {
        const store = this.componentStores.get(componentName);
        return store ? store.get(entityId) : undefined;
    }

    destroyEntityComponents(entityId, session) {
        const poolManager = session.componentPoolManager;

        for (const [componentName, store] of this.componentStores.entries()) {
            if (store.has(entityId)) {

                if (componentName === 'position_history') {
                    const historyBuffer = store.get(entityId);
                    if (historyBuffer) {

                        const snapshotsToRelease = historyBuffer.drain();
                        for (const snapshot of snapshotsToRelease) {
                            poolManager.release('history_snapshot', snapshot);
                        }
                    }
                }

                if (!TAG_COMPONENTS.has(componentName)) {
                    if (poolManager) {
                        const componentInstance = store.get(entityId);
                        if (componentInstance) {
                            poolManager.release(componentName, componentInstance);
                        }
                    } else {
                        logger.error(`[ComponentManager] Отсутствует poolManager в сессии при попытке вернуть компонент ${componentName}`);
                    }
                }
                store.delete(entityId);
            }
        }
    }
}

module.exports = ComponentManager;
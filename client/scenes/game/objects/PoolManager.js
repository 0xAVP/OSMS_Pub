import Phaser from 'phaser';

/**
 * Централизованный менеджер для управления пулами игровых объектов и объектов данных.
 */
export class PoolManager {
    /**
     * @param {Phaser.Scene} scene
     */
    constructor(scene) {
        this.scene = scene;
        /** @private */
        this.pools = new Map();
        /** @private */
        this.configs = new Map();
    }

    /**
     * Создает и регистрирует новый пул.
     * @param {string} key Уникальное имя пула.
     * @param {object} config Конфигурация пула.
     * @param {'group' | 'data'} [config.type='group'] Тип пула. 'group' для GameObjects, 'data' для JS-объектов.
     * @param {number} [config.maxSize] Максимальный размер пула.
     * @param {function} [config.createCallback] Функция для инициализации новых объектов данных.
     */
    createPool(key, config = {}) {
        if (this.pools.has(key)) {
            console.warn(`PoolManager: Пул с ключом "${key}" уже существует.`);
            return;
        }

        const poolType = config.type || 'group';
        this.configs.set(key, config);

        if (poolType === 'data') {
            const dataPool = [];
            this.pools.set(key, dataPool);
            console.log(`PoolManager: Создан пул ДАННЫХ "${key}".`);
        } else {
            const defaultConfig = {active: false, visible: false};
            const groupConfig = {...defaultConfig, ...config};
            let group;

            if (groupConfig.isPhysicsGroup) {

                delete groupConfig.isPhysicsGroup;
                group = this.scene.physics.add.group(groupConfig);
                console.log(`PoolManager: Создан ФИЗИЧЕСКИЙ пул объектов "${key}".`);
            } else {
                group = this.scene.add.group(groupConfig);
                console.log(`PoolManager: Создан ОБЫЧНЫЙ пул объектов "${key}".`);
            }

            this.pools.set(key, group);
        }
    }

    /**
     * Получает ("спавнит") объект из указанного пула.
     * @param {string} key Ключ пула.
     * @returns {any | null}
     */
    spawn(key, ...args) {
        const pool = this.pools.get(key);
        if (!pool) {
            console.error(`PoolManager: Пул с ключом "${key}" не найден.`);
            return null;
        }

        if (pool instanceof Phaser.GameObjects.Group) {
            const item = pool.get(...args);
            if (!item) {
                console.warn(`PoolManager: Пул ОБЪЕКТОВ "${key}" переполнен.`);
                return null;
            }
            item.setActive(true).setVisible(true);
            return item;
        } else if (Array.isArray(pool)) {
            if (pool.length > 0) {
                return pool.pop();
            }

            const config = this.configs.get(key);
            if (config && typeof config.createCallback === 'function') {

                return config.createCallback();
            }

            return {};
        }
        return null;
    }

    /**
     * Возвращает объект в его пул.
     * @param {string} key Ключ пула.
     * @param {any} item Объект для возврата.
     */
    despawn(key, item) {
        const pool = this.pools.get(key);
        if (!pool) {
            item.destroy?.();
            return;
        }

        if (pool instanceof Phaser.GameObjects.Group) {
            pool.killAndHide(item);
        } else if (Array.isArray(pool)) {

            const config = this.configs.get(key);
            if (!config.maxSize || pool.length < config.maxSize) {
                pool.push(item);
            }
        }
    }

    /**
     * Уничтожает все созданные пулы.
     */
    destroy() {
        this.pools.forEach((pool, key) => {
            if (pool instanceof Phaser.GameObjects.Group) {
                pool.destroy(true);
            } else if (Array.isArray(pool)) {
                pool.length = 0;
            }
            console.log(`PoolManager: Пул "${key}" очищен/уничтожен.`);
        });
        this.pools.clear();
        this.configs.clear();
    }
}
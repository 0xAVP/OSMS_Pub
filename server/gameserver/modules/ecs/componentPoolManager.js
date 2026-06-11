const ObjectPool = require('../../utils/ObjectPool');
const CircularBuffer = require('../../utils/CircularBuffer');
const CONFIG = require('../../core/config');

/**
 * Управляет пулами переиспользуемых компонентов для одной игровой сессии.
 * Централизует логику создания, получения (acquire) и возврата (release)
 * компонентов, чтобы снизить нагрузку на сборщик мусора.
 */
class ComponentPoolManager {
    constructor() {
        /**
         * @type {Map<string, ObjectPool>}
         * @private
         */
        this._pools = new Map();
        this._registerPools();
    }

    /**
     * Регистрирует все компоненты, которые будут управляться пулами.
     * Здесь определяется "фабрика" для каждого компонента, которая также
     * включает его метод `reset`.
     * @private
     */
    _registerPools() {
        const componentFactories = {
            position: () => ({
                x: 0,
                y: 0,
                rotation: undefined,
                _gridKey: null,
                reset() {
                    this.x = 0;
                    this.y = 0;
                    this.rotation = undefined;
                    this._gridKey = null;
                }
            }),
            velocity: () => ({
                x: 0, y: 0,
                reset() {
                    this.x = 0;
                    this.y = 0;
                }
            }),
            collision_geometry: () => ({
                isCircle: false,
                radius: 0,
                width: 0,
                height: 0,
                aabb: {x: 0, y: 0, width: 0, height: 0},

                reset() {
                    this.isCircle = false;
                    this.radius = 0;
                    this.width = 0;
                    this.height = 0;
                    this.aabb.x = 0;
                    this.aabb.y = 0;
                    this.aabb.width = 0;
                    this.aabb.height = 0;
                }
            }),
            position_history: () => new CircularBuffer(CONFIG.performance.HISTORY_BUFFER_CAPACITY),
            history_snapshot: () => ({
                timestamp: 0,
                xMin: 0, xMax: 0,
                yMin: 0, yMax: 0,
                reset() {
                    this.timestamp = 0;
                    this.xMin = 0;
                    this.xMax = 0;
                    this.yMin = 0;
                    this.yMax = 0;
                }
            }),
            loot_drop_request: () => ({
                reason: null,
                reset() {
                    this.reason = null;
                }
            }),
            stats: () => ({
                hp: 0,
                maxHp: 0,
                collisionDamage: 0,
                reset() {
                    this.hp = 0;
                    this.maxHp = 0;
                    this.collisionDamage = 0;
                }
            }),
            render: () => ({
                typeId: null, size: null, name: '',
                reset() {
                    this.typeId = null;
                    this.size = null;
                    this.name = '';
                }
            }),
            weaponState: () => ({
                weapons: null,
                lastFired: 0,
                activeWeaponIndex: 0,
                lastWeaponChange: 0,
                shotQueue: null,
                fireRate: 0,
                bulletType: '',
                bulletSize: null,
                bulletDamage: 0,
                fireRequested: false,
                requestedWeaponIndex: null,
                bulletLifetimeMs: null,
                reset() {
                    this.weapons = null;
                    this.lastFired = 0;
                    this.activeWeaponIndex = 0;
                    this.lastWeaponChange = 0;
                    this.shotQueue = null;
                    this.fireRate = 0;
                    this.bulletType = '';
                    this.bulletSize = null;
                    this.bulletDamage = 0;
                    this.fireRequested = false;
                    this.requestedWeaponIndex = null;
                    this.bulletLifetimeMs = null;
                }
            }),
            statusEffects: () => ({
                spawnTimestamp: 0,
                stunnedUntil: 0,
                stunImmuneUntil: 0,
                lastPlayerCollision: 0,
                reset() {
                    this.spawnTimestamp = 0;
                    this.stunnedUntil = 0;
                    this.stunImmuneUntil = 0;
                    this.lastPlayerCollision = 0;
                }
            }),
            lifetime: () => ({
                expiresAt: 0,
                reset() {
                    this.expiresAt = 0;
                }
            }),
            behavior: () => ({
                boundaryBehavior: 'none',
                script: null,
                baseSpeed: 0,
                currentStateIndex: undefined,
                stateTimer: 0,
                stateInitialized: false,
                stateData: {},

                reset() {
                    this.script = null;
                    this.baseSpeed = 0;
                    this.boundaryBehavior = 'none';
                    this.currentStateIndex = undefined;
                    this.stateTimer = 0;
                    this.stateInitialized = false;
                    this.stateData = {};
                }
            }),
            projectile: () => ({
                owner: 'enemy', damage: 0, ignoredEntities: new Set(),
                reset() {
                    this.damage = 0;
                    this.ignoredEntities.clear();
                }
            }),
            powerup: () => ({
                typeId: null,
                effect: null,
                despawnAt: 0,
                reset() {
                    this.typeId = null;
                    this.effect = null;
                    this.despawnAt = 0;
                }
            }),
            buff_instance: () => ({
                expiresAt: null,
                effect: null,
                reset() {
                    this.expiresAt = null;
                    this.effect = null;
                }
            }),
            cached_stats: () => ({

                critChance: 0,
                critModifier: 0,
                damageMultiplier: 1.0,

                maxShield: 0,
                shieldRegen: 0,

                armorAbsorptionChance: 0,
                armorAbsorptionAmount: 0,

                energyRegen: 0,
                evasion: 0,

                reset() {
                    this.critChance = 0;
                    this.critModifier = 0;
                    this.damageMultiplier = 1.0;
                    this.maxShield = 0;
                    this.shieldRegen = 0;
                    this.armorAbsorptionChance = 0;
                    this.armorAbsorptionAmount = 0;
                    this.energyRegen = 0;
                    this.evasion = 0;
                }
            }),
            collision_event: () => ({
                type: null,
                entityA: null,
                entityB: null,
                reset() {
                    this.type = null;
                    this.entityA = null;
                    this.entityB = null;
                }
            }),
        };

        for (const [name, factory] of Object.entries(componentFactories)) {
            this._pools.set(name, new ObjectPool(factory));
        }
    }

    /**
     * Получает сброшенный компонент из соответствующего пула.
     * @param {string} componentName - Имя компонента (e.g., 'position').
     * @returns {*} Экземпляр компонента, готовый к использованию.
     */
    acquire(componentName) {
        const pool = this._pools.get(componentName);
        if (!pool) {
            throw new Error(`[ComponentPoolManager] Пул для компонента "${componentName}" не зарегистрирован.`);
        }
        const component = pool.acquire();

        if (typeof component.reset === 'function') {
            component.reset();
        }

        return component;
    }

    /**
     * Возвращает компонент обратно в пул для переиспользования.
     * @param {string} componentName - Имя компонента.
     * @param {*} componentInstance - Экземпляр компонента для возврата.
     */
    release(componentName, componentInstance) {
        const pool = this._pools.get(componentName);
        if (pool) {
            pool.release(componentInstance);
        } else {

            console.warn(`[ComponentPoolManager] Попытка вернуть компонент "${componentName}", для которого нет пула.`);
        }
    }

}

module.exports = ComponentPoolManager;
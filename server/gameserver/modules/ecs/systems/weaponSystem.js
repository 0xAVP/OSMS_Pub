const System = require('./System');
const CONFIG = require('../../../core/config');
const logger = require("../../../core/logger");
const {addEnemyBulletComponents} = require("../componentFactory");
const statusEffectSystem = require('./statusEffectSystem');

class WeaponSystem extends System {
    constructor() {
        super();
        logger.info('[ECS:WeaponSystem] Initialized.');
    }

    update(entityId, cm, now, session) {
        if (statusEffectSystem.checkStun(entityId, cm, now)) {
            return;
        }

        const weaponState = cm.getComponent(entityId, 'weaponState');
        const position = cm.getComponent(entityId, 'position');
        if (!weaponState || !position) return;

        const isReadyToFire = weaponState.fireRequested && (now - weaponState.lastFired > weaponState.fireRate);

        if (!isReadyToFire) {

            this.processShotQueue(weaponState, now, session, position);
            return;
        }

        weaponState.fireRequested = false;

        const weapon = weaponState.weapons[weaponState.activeWeaponIndex || 0].weapon;
        const firePattern = weapon?.firePattern;

        if (firePattern) {
            const components = {
                position: position,
                weaponState: weaponState,
                velocity: cm.getComponent(entityId, 'velocity'),
            };

            const fireResult = firePattern(components, session);

            if (fireResult.shotQueue) {
                weaponState.shotQueue = fireResult.shotQueue;
            }

            const bulletVectors = fireResult.immediateVectors;

            if (bulletVectors && bulletVectors.length > 0) {
                if (this.canCreateBullet(session)) {

                    const startPosition = this._calculateMuzzlePosition(position, weapon);

                    for (const vector of bulletVectors) {

                        this.createBullet(session, startPosition, vector, weaponState);
                    }
                    weaponState.lastFired = now;
                }
            }
        }
    }

    _calculateMuzzlePosition(position, weapon) {
        const muzzleOffset = weapon.muzzleOffset || 0;
        if (muzzleOffset > 0) {
            const rotation = position.rotation || 0;
            return {
                x: position.x + muzzleOffset * Math.cos(rotation),
                y: position.y + muzzleOffset * Math.sin(rotation)
            };
        }
        return position;
    }

    processShotQueue(weaponState, now, session, position) {
        if (weaponState.shotQueue && now - weaponState.shotQueue.lastShotTime > weaponState.shotQueue.delay) {
            if (this.canCreateBullet(session)) {

                const weapon = weaponState.weapons[weaponState.activeWeaponIndex || 0].weapon;

                const startPosition = this._calculateMuzzlePosition(position, weapon);

                this.createBullet(session, startPosition, weaponState.shotQueue.vector, weaponState);

                weaponState.shotQueue.remaining--;
                weaponState.shotQueue.lastShotTime = now;
            }
            if (weaponState.shotQueue.remaining <= 0) {
                weaponState.shotQueue = null;
            }
        }
    }

    /**
     * Вспомогательный метод для проверки лимита пуль.
     */
    canCreateBullet(session) {
        return session.activeEntities.enemyBullets.size < CONFIG.performance.ENEMY_BULLET_POOL_SIZE;
    }

    createBullet(session, startPosition, velocity, weaponState) {
        const entityId = session.entityManager.createEntity();
        addEnemyBulletComponents(session.componentManager, entityId, startPosition, velocity, weaponState, session);
        session.activeEntities.enemyBullets.add(entityId);
    }
}

module.exports = new WeaponSystem();
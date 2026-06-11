const {GET, EPK, RTE, PWRSK} = require('../core/gameStateKeys');
const logger = require("../core/logger");

class DestructionEventSystem {
    constructor() {
        logger.info('[ECS:DestructionEventSystem] Initialized as the main destruction controller.');
    }

    process(session) {
        const cm = session.componentManager;

        const destructionStore = cm.componentStores.get('pending_destruction');

        if (!destructionStore || destructionStore.size === 0) {
            return;
        }

        for (const [entityId, destructionInfo] of destructionStore.entries()) {

            switch (true) {
                case !!cm.getComponent(entityId, 'enemy'): {
                    session.activeEntities.enemies.delete(entityId);

                    if (destructionInfo.reason === 'killed') {
                        const finalLoot = destructionInfo.lootPayload;
                        const payload = {
                            [EPK.ENEMY_ID]: entityId,
                            [EPK.LOOT]: (finalLoot && finalLoot.length > 0) ? finalLoot : null,
                            [EPK.NEW_KILL_COUNT]: destructionInfo.killCountSnapshot,
                            [EPK.REMOVAL_TYPE]: RTE.KILLED,
                        };
                        session.gameEvents.push([GET.ENEMY_DESTROYED, payload]);
                    }

                    session.replication.destroyedEnemyIds.push(entityId);
                    break;
                }

                case !!cm.getComponent(entityId, 'powerup'): {
                    session.activeEntities.powerUps.delete(entityId);
                    if (destructionInfo.reason === 'picked_up') {
                        const powerupComponent = cm.getComponent(entityId, 'powerup');
                        if (powerupComponent) {
                            session.gameEvents.push([
                                GET.POWERUP_ACQUIRED,
                                {[PWRSK.ID]: entityId, [PWRSK.TYPE_ID]: powerupComponent.typeId}
                            ]);
                        }
                    }

                    session.replication.destroyedPowerUpIds.push(entityId);
                    break;
                }

                case !!cm.getComponent(entityId, 'projectile'): {
                    session.activeEntities.enemyBullets.delete(entityId);

                    if (destructionInfo.reason === 'collided_with_player') {
                        session.gameEvents.push([
                            GET.BULLET_COLLIDED,
                            {[EPK.BULLET_ID]: entityId}
                        ]);
                    }

                    session.replication.destroyedBulletIds.push(entityId);
                    break;
                }
            }

            session.entitiesToDestroy.add(entityId);

            cm.removeComponent(entityId, 'pending_destruction');
        }
    }
}

module.exports = new DestructionEventSystem();
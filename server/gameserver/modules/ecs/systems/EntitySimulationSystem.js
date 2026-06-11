const logger = require('../../../core/logger');

const enemySpawnRequestSystem = require('./EnemySpawnRequestSystem');
const behaviorSystemV2 = require('./BehaviorSystemV2');
const combatAISystem = require('./CombatAISystem');
const weaponSwitchSystem = require('./WeaponSwitchSystem');
const weaponSystem = require('./weaponSystem');
const movementSystem = require('./movementSystem');

class EntitySimulationSystem {
    constructor() {
        logger.info('[ECS:EntitySimulationSystem] Initialized as the main simulation orchestrator.');
    }

    /**
     * Выполняет полный шаг симуляции мира сущностей для одной сессии.
     * @param {object} session - Игровая сессия.
     * @param {number} now - Текущая временная метка (Date.now()).
     * @param {number} delta - Время, прошедшее с последнего шага симуляции (в секундах).
     */
    process(session, now, delta) {
        const cm = session.componentManager;

        enemySpawnRequestSystem.process(session, now);

        const behaviorStore = cm.componentStores.get('behavior');
        if (behaviorStore) {
            for (const entityId of behaviorStore.keys()) {

                behaviorSystemV2.update(entityId, cm, delta, session);
                combatAISystem.update(entityId, cm, session);

                weaponSwitchSystem.update(entityId, cm, now);
                weaponSystem.update(entityId, cm, now, session);
            }
        }

        const velocityStore = cm.componentStores.get('velocity');
        if (velocityStore) {
            for (const entityId of velocityStore.keys()) {
                if (entityId === session.playerEntityId) {
                    continue;
                }
                movementSystem.update(entityId, session, delta);
            }
        }
    }
}

module.exports = new EntitySimulationSystem();
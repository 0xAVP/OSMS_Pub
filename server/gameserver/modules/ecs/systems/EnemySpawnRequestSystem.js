const {ENEMIES} = require('../../../objects/enemies/enemies');
const {BOSSES} = require('../../../objects/enemies/bosses');
const logger = require('../../../core/logger');

class EnemySpawnRequestSystem {
    constructor() {
        logger.info('[ECS:EnemySpawnRequestSystem] Initialized.');
    }

    /**
     * Проверяет игровые условия (таймеры, лимиты, состояние волны) и создает
     * запросы на спавн врагов, добавляя сущностям компонент 'spawn_request'.
     * @param {object} session - Игровая сессия.
     * @param {number} now - Текущее время (Date.now()).
     */
    process(session, now) {

        if (session.countdown.isPreparation || session.isLastStageWave || session.isBossWave) {
            return;
        }

        const em = session.entityManager;
        const cm = session.componentManager;

        let waveEnemyCount = 0;
        const minionStore = cm.componentStores.get('minion');

        for (const entityId of session.activeEntities.enemies) {
            if (!minionStore || !minionStore.has(entityId)) {
                waveEnemyCount++;
            }
        }

        if (now - session.lastEnemySpawn > session.currentSpawnRate && waveEnemyCount < session.maxActiveEnemies) {
            const waveNumberInStage = Math.floor((session.countdown.gameTime % 180) / 30) + 1;
            const enemyType = getEnemyType(session.currentWave, session.currentStage, waveNumberInStage, session);

            if (ENEMIES[enemyType] || BOSSES[enemyType]) {
                const newEntityId = em.createEntity();
                cm.addComponent(newEntityId, 'spawn_request', {typeId: enemyType});

                session.lastEnemySpawn = now;
            }

        }
    }
}

function getEnemyType(waveConfig, stageConfig, waveNumberInStage, session) {
    try {

        const enemies = session.currentEnemies || stageConfig.enemies || [{type: 1, weight: 1.0}];

        const totalWeight = enemies.reduce((sum, enemy) => sum + (enemy.weight || 1.0), 0);
        let random = Math.random() * totalWeight;
        for (const enemy of enemies) {
            random -= enemy.weight || 1.0;
            if (random <= 0) {
                return enemy.type;
            }
        }
        return enemies[0].type;
    } catch (error) {
        logger.error(`[ENEMYPOOL] Error selecting enemy type: ${error.message}`);
        return 1;
    }
}

module.exports = new EnemySpawnRequestSystem();
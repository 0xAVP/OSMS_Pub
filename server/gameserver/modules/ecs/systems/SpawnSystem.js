const {addEnemyComponents} = require('../componentFactory');
const {ENEMIES} = require('../../../objects/enemies/enemies');
const {BOSSES} = require('../../../objects/enemies/bosses');
const {enhanceEnemy} = require('../../states/enemyEnhancer');
const CONFIG = require('../../../core/config');
const logger = require('../../../core/logger');

class SpawnSystem {
    constructor() {
        logger.info('[ECS:SpawnSystem] Initialized.');
    }

    process(session) {
        const cm = session.componentManager;
        const spawnRequests = cm.componentStores.get('spawn_request');

        if (!spawnRequests || spawnRequests.size === 0) {
            return;
        }

        for (const [entityId, request] of spawnRequests.entries()) {
            if (request.typeId === 10003) {
                logger.info(`[SpawnSystem] Обнаружен запрос на спавн мины (typeId: 10003) для сущности ${entityId}. Начинаю обработку.`);
            }
        }

        const now = Date.now();
        const requestsToProcess = Array.from(spawnRequests.entries());

        for (const [entityId, request] of requestsToProcess) {

            const staticEnemyData = ENEMIES[request.typeId] || BOSSES[request.typeId];

            if (request.typeId === 10003) {
                if (staticEnemyData) {
                    logger.info(`[SpawnSystem] Конфигурация для мины (typeId: 10003) успешно найдена. Имя: ${staticEnemyData.name}`);
                } else {
                    logger.error(`[SpawnSystem] КРИТИЧЕСКАЯ ОШИБКА: Конфигурация для мины (typeId: 10003) НЕ НАЙДЕНА! Спавн невозможен.`);
                }
            }

            if (!staticEnemyData) {
                logger.error(`[SpawnSystem] Could not find static config for typeId "${request.typeId}".`);
                cm.addComponent(entityId, 'pending_destruction', {reason: 'invalid_spawn'});
                cm.removeComponent(entityId, 'spawn_request');
                continue;
            }

            let finalStats;
            if (session.currentWave && session.currentStage) {
                finalStats = enhanceEnemy(staticEnemyData, session);
            } else {

                finalStats = {
                    hp: staticEnemyData.hp,
                    speed: staticEnemyData.speed * session.speedScaleFactor,
                    collisionDamage: staticEnemyData.collisionDamage,
                    weapons: staticEnemyData.weapons
                };
            }

            const entitySize = {
                width: Math.round(staticEnemyData.texture.size.width * staticEnemyData.texture.scale * session.sizeScaleFactor),
                height: Math.round(staticEnemyData.texture.size.height * staticEnemyData.texture.scale * session.sizeScaleFactor)
            };

            let position;

            if (staticEnemyData.isStatic) {

                const freeCell = session.staticSpawnGrid.occupyRandomFreeCell();

                if (freeCell) {

                    position = session.staticSpawnGrid.getCellCenterWorldCoords(freeCell.c, freeCell.r);
                    cm.addComponent(entityId, 'static_grid_occupant', freeCell);

                } else {

                    logger.warn(`[SpawnSystem] No free cells left for static enemy ${request.typeId}. Skipping spawn.`);
                    cm.addComponent(entityId, 'pending_destruction', {reason: 'spawn_failed_no_space'});
                    cm.removeComponent(entityId, 'spawn_request');
                    continue;
                }
            } else {

                const spawnPattern = request.spawnPattern || staticEnemyData.spawnPattern || 'default';
                position = request.position || this.calculateSpawnPosition(spawnPattern, session, entitySize);
            }

            addEnemyComponents(cm, entityId, request.typeId, staticEnemyData, finalStats, entitySize, position, now, session);

            if (staticEnemyData.isMinion) {
                cm.addComponent(entityId, 'minion', {});
            }

            session.activeEntities.enemies.add(entityId);

            cm.removeComponent(entityId, 'spawn_request');
        }
    }

    calculateSpawnPosition(spawnPattern, session, entitySize) {
        const spawnConfig = CONFIG.game.spawn;
        switch (spawnPattern) {
            case 'top_right_random': {
                const spawnXMin = session.width / 2;
                const spawnXMax = session.width - entitySize.width / 2;
                return {
                    x: Math.floor(Math.random() * (spawnXMax - spawnXMin + 1)) + spawnXMin,
                    y: -spawnConfig.Y_OFFSET
                };
            }
            case 'side_random': {
                const spawnXMin = session.width * 0.5;
                const spawnXMax = session.width * 0.90;
                const spawnYMin = session.height * 0.10;
                const spawnYMax = session.height * 0.90;
                return {
                    x: Math.floor(Math.random() * (spawnXMax - spawnXMin + 1)) + spawnXMin,
                    y: Math.floor(Math.random() * (spawnYMax - spawnYMin + 1)) + spawnYMin
                };
            }
            default: {
                const spawnYMin = spawnConfig.Y_OFFSET;
                const spawnYMax = session.height - spawnConfig.Y_OFFSET;
                return {
                    x: session.width + spawnConfig.X_OFFSET,
                    y: Math.floor(Math.random() * (spawnYMax - spawnYMin + 1)) + spawnYMin
                };
            }
        }
    }
}

module.exports = new SpawnSystem();
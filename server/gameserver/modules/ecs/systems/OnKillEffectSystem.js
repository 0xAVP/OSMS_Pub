const {ENEMIES} = require('../../../objects/enemies/enemies');
const {BOSSES} = require('../../../objects/enemies/bosses');
const {POWERUP_DATA} = require('../../../objects/effects/powerups');
const {addPowerUpComponents} = require('../componentFactory');
const logger = require('../../../core/logger');
const CONFIG = require("../../../core/config");
const {getPreciseHistoricalBounds} = require("../../entities/collisionUtils");

class OnKillEffectSystem {
    constructor() {
        logger.info('[ECS:OnKillEffectSystem] Initialized.');
    }

    process(session) {
        const cm = session.componentManager;
        const destructionStore = cm.componentStores.get('pending_destruction');

        if (!destructionStore || destructionStore.size === 0) {
            return;
        }

        for (const [entityId, destructionInfo] of destructionStore.entries()) {

            if (destructionInfo.reason !== 'killed' || !cm.getComponent(entityId, 'enemy')) {
                continue;
            }

            const renderInfo = cm.getComponent(entityId, 'render');
            const position = cm.getComponent(entityId, 'position');
            if (!renderInfo || !position) continue;

            const enemyConfig = ENEMIES[renderInfo.typeId] || BOSSES[renderInfo.typeId];

            if (!enemyConfig || !enemyConfig.onKillEffects) continue;

            const effectsOnKill = enemyConfig.onKillEffects;

            if (effectsOnKill.spawnEntity && Math.random() < effectsOnKill.spawnEntity.chance) {
                this.requestEntitySpawn(session, entityId, effectsOnKill.spawnEntity.typeId, position);
            }

            const dropConfig = effectsOnKill.spawnPowerUp;
            if (dropConfig && dropConfig.pool && Math.random() < dropConfig.masterChance) {

                this.spawnPowerUp(session, dropConfig.pool, entityId, position);
            }
        }
    }

    /**
     * Создает запрос на спавн новой сущности.
     */
    requestEntitySpawn(session, deadEnemyId, typeIdToSpawn, position) {
        logger.debug(`[OnKillEffectSystem] Requesting spawn of type ${typeIdToSpawn} from killed enemy ${deadEnemyId}.`);

        const newEntityId = session.entityManager.createEntity();
        session.componentManager.addComponent(newEntityId, 'spawn_request', {
            typeId: typeIdToSpawn,
            position: {x: position.x, y: position.y}
        });
    }

    /**
     * Логика спавна паверапа (взята из старой PowerUpDropSystem).
     */
    spawnPowerUp(session, pool, destroyedEnemyId, fallbackPosition) {

        const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
        let randomRoll = Math.random() * totalWeight;
        let chosenDrop = pool[0];

        for (const item of pool) {
            randomRoll -= item.weight;
            if (randomRoll <= 0) {
                chosenDrop = item;
                break;
            }
        }

        const powerUpConfig = POWERUP_DATA[chosenDrop.type];
        if (!powerUpConfig) return;

        let spawnPosition = null;
        const cm = session.componentManager;
        const now = Date.now();
        const lookbackTime = now - CONFIG.performance.CLIENT_RENDER_DELAY_MS;

        const historicalBoundsObject = {xMin: 0, xMax: 0, yMin: 0, yMax: 0};
        const boundsFound = getPreciseHistoricalBounds(destroyedEnemyId, cm, lookbackTime, historicalBoundsObject);

        if (boundsFound) {
            if (fallbackPosition) {
                spawnPosition = {x: fallbackPosition.x, y: fallbackPosition.y};
            }
        } else {
            const enemyPosition = cm.getComponent(destroyedEnemyId, 'position');
            if (enemyPosition) {
                spawnPosition = {x: enemyPosition.x, y: enemyPosition.y};
            }
        }

        if (!spawnPosition) {
            logger.warn(`[OnKillEffectSystem] Cannot spawn powerup, failed to determine position for destroyed enemy ${destroyedEnemyId}.`);
            return;
        }

        const sizeScaleFactor = session.sizeScaleFactor || 1.0;
        const scaledSize = {
            width: Math.round(powerUpConfig.size.width * sizeScaleFactor),
            height: Math.round(powerUpConfig.size.height * sizeScaleFactor)
        };
        const halfWidth = scaledSize.width / 2;
        const halfHeight = scaledSize.height / 2;
        spawnPosition.x = Math.max(halfWidth, Math.min(spawnPosition.x, session.width - halfWidth));
        spawnPosition.y = Math.max(halfHeight, Math.min(spawnPosition.y, session.height - halfHeight));

        const entityId = session.entityManager.createEntity();
        addPowerUpComponents(session.componentManager, entityId, {
            ...powerUpConfig,
            size: scaledSize
        }, spawnPosition, session);
        session.activeEntities.powerUps.add(entityId);
    }
}

module.exports = new OnKillEffectSystem();
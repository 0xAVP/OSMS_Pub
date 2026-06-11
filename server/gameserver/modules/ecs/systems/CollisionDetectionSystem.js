const System = require('./System');
const logger = require("../../../core/logger");
const CONFIG = require('../../../core/config');
const {getPreciseHistoricalBounds, checkCircleRectCollision} = require('../../entities/collisionUtils');

const BASE_BROADPHASE_PADDING = 100.0;

class CollisionDetectionSystem extends System {
    constructor() {
        super();
        this._queryBounds = {x: 0, y: 0, width: 0, height: 0};
        this._historicalBounds = {xMin: 0, xMax: 0, yMin: 0, yMax: 0};
        logger.info('[ECS:CollisionDetectionSystem] Initialized. (Now unified)');
    }

    update(session) {
        const cm = session.componentManager;
        const now = Date.now();
        const playerEntityId = session.playerEntityId;

        const playerGeo = cm.getComponent(playerEntityId, 'collision_geometry');
        if (!playerGeo) return;

        const scaledPadding = BASE_BROADPHASE_PADDING * session.speedScaleFactor;

        const queryBounds = this._queryBounds;
        queryBounds.x = playerGeo.aabb.x - scaledPadding;
        queryBounds.y = playerGeo.aabb.y - scaledPadding;
        queryBounds.width = playerGeo.aabb.width + (scaledPadding * 2);
        queryBounds.height = playerGeo.aabb.height + (scaledPadding * 2);

        const candidates = session.gridQueryCache;
        session.spatialGrid.query(queryBounds, candidates);

        if (candidates.size === 0) {
            return;
        }

        const playerCircleX = playerGeo.aabb.x + playerGeo.radius;
        const playerCircleY = playerGeo.aabb.y + playerGeo.radius;
        const lookbackTime = now - (session.ping / 2) - CONFIG.performance.CLIENT_RENDER_DELAY_MS;

        for (const entityId of candidates) {
            if (entityId === playerEntityId || cm.getComponent(entityId, 'pending_destruction')) {
                continue;
            }

            const hasBounds = getPreciseHistoricalBounds(entityId, cm, lookbackTime, this._historicalBounds);
            if (!hasBounds) {
                continue;
            }

            const historicalBounds = this._historicalBounds;

            const rectX = historicalBounds.xMin;
            const rectY = historicalBounds.yMin;
            const rectWidth = historicalBounds.xMax - historicalBounds.xMin;
            const rectHeight = historicalBounds.yMax - historicalBounds.yMin;

            const isColliding = checkCircleRectCollision(
                playerCircleX, playerCircleY, playerGeo.radius,
                rectX, rectY, rectWidth, rectHeight
            );

            if (!isColliding) {
                continue;
            }

            if (cm.getComponent(entityId, 'projectile')) {
                const event = session.componentPoolManager.acquire('collision_event');
                event.type = 'enemyBullet_vs_player';
                event.entityA = entityId;
                event.entityB = playerEntityId;
                session.collisionEvents.push(event);
            } else if (cm.getComponent(entityId, 'enemy')) {
                const event = session.componentPoolManager.acquire('collision_event');
                event.type = 'enemy_vs_player';
                event.entityA = entityId;
                event.entityB = playerEntityId;
                session.collisionEvents.push(event);
            } else if (cm.getComponent(entityId, 'powerup')) {
                const event = session.componentPoolManager.acquire('collision_event');
                event.type = 'player_vs_powerup';
                event.entityA = playerEntityId;
                event.entityB = entityId;
                session.collisionEvents.push(event);
            }
        }
    }
}

module.exports = new CollisionDetectionSystem();
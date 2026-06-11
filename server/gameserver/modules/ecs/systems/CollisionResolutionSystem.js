const System = require('./System');
const {applyDamageToPlayer, applyDamageToEnemy} = require('../../entities/collisionUtils');
const {checkEvasion} = require('../../mechanics/damageCalculator');
const {terminateSession} = require('../../session/sessionTerminator');
const {GET, EPK, PWRSK} = require('../../../core/gameStateKeys');
const {addBuff} = require('../../mechanics/buffManager');
const instantEffectSystem = require('../../mechanics/InstantEffectSystem');
const logger = require("../../../core/logger");
const CONFIG = require("../../../core/config");

class CollisionResolutionSystem extends System {
    constructor() {
        super();
        logger.info('[ECS:CollisionResolutionSystem] Initialized.');
    }

    /**
     * Обрабатывает все зарегистрированные события столкновекновений.
     * @param {object} session - Игровая сессия.
     */
    update(session) {

        if (!session.collisionEvents || session.collisionEvents.length === 0) {
            return;
        }
        const poolManager = session.componentPoolManager;

        for (const collisionEvent of session.collisionEvents) {
            switch (collisionEvent.type) {
                case 'enemyBullet_vs_player':
                    this.handleEnemyBulletVsPlayer(session, collisionEvent.entityA, collisionEvent.entityB);
                    break;
                case 'enemy_vs_player':
                    this.handleEnemyVsPlayer(session, collisionEvent.entityA, collisionEvent.entityB);
                    break;
                case 'player_vs_powerup':
                    this.handlePlayerVsPowerup(session, collisionEvent.entityA, collisionEvent.entityB);
                    break;
                default:
                    console.warn(`[CollisionResolutionSystem] Unhandled collision event type: "${collisionEvent.type}".`);
                    break;
            }
            poolManager.release('collision_event', collisionEvent);
        }

        session.collisionEvents.length = 0;
    }

    handleEnemyBulletVsPlayer(session, bulletId, playerId) {
        const cm = session.componentManager;

        const projectile = cm.getComponent(bulletId, 'projectile');
        if (!projectile) return;

        if (projectile.ignoredEntities && projectile.ignoredEntities.has(playerId)) {
            return;
        }

        const engineStats = cm.getComponent(playerId, 'engine_stats');
        if (!engineStats) {
            console.error(`[CollisionResolutionSystem] Critical: Player entity ${playerId} is missing 'engine_stats' component.`);

            applyDamageToPlayer(session, playerId, projectile.damage);
            cm.addComponent(bulletId, 'pending_destruction', {reason: 'collided_with_player'});
            return;
        }

        if (checkEvasion(session, playerId)) {

            session.gameEvents.push([GET.PLAYER_EVADE_FEEDBACK]);

            projectile.ignoredEntities.add(playerId);
        } else {

            applyDamageToPlayer(session, playerId, projectile.damage);

            cm.addComponent(bulletId, 'pending_destruction', {reason: 'collided_with_player'});
        }
    }

    handleEnemyVsPlayer(session, enemyId, playerId) {
        const cm = session.componentManager;
        const now = Date.now();

        const enemyStats = cm.getComponent(enemyId, 'stats');
        const statusEffects = cm.getComponent(enemyId, 'statusEffects');

        if (!enemyStats || !statusEffects) return;

        const isStaticEnemy = cm.getComponent(enemyId, 'static_grid_occupant');

        if (isStaticEnemy && (now - statusEffects.spawnTimestamp < CONFIG.game.SPAWN_COLLISION_INVULNERABILITY_MS)) {

            logger.debug(`[CollisionResolution] Ignored collision: Static enemy ${enemyId} is in spawn grace period.`);
            return;
        }

        if (now - statusEffects.lastPlayerCollision < CONFIG.game.COLLISION_COOLDOWN_MS) {
            return;
        }

        statusEffects.lastPlayerCollision = now;

        if (cm.getComponent(enemyId, 'oneshot')) {
            terminateSession(session, 'playerLoose');
        } else {
            applyDamageToPlayer(session, playerId, enemyStats.collisionDamage, true);
        }

        session.gameEvents.push([
            GET.ENEMY_COLLISION_DESTROYED,
            {[EPK.ENEMY_ID]: enemyId}
        ]);

        applyDamageToEnemy(enemyId, Number.MAX_SAFE_INTEGER, session, false, {suppressEvent: true});
    }

    handlePlayerVsPowerup(session, playerId, powerupId) {
        const cm = session.componentManager;
        const powerupComponent = cm.getComponent(powerupId, 'powerup');

        if (!powerupComponent || !powerupComponent.effect) return;

        if (powerupComponent.effect.actionType === 'instant') {

            instantEffectSystem.apply(playerId, powerupComponent.effect, session);
        } else {

            addBuff(playerId, powerupComponent.effect, session);
        }

        cm.addComponent(powerupId, 'pending_destruction', {reason: 'picked_up'});
    }
}

module.exports = new CollisionResolutionSystem();
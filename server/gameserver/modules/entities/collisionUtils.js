const {SESSION_STATES} = require("../session/sessionStates");
const CONFIG = require("../../core/config");
const {calculateAbsorption} = require("../mechanics/damageCalculator");
const {GET, EPK} = require("../../core/gameStateKeys");
const {terminateSession} = require("../session/sessionTerminator");

function checkCircleRectCollision(circleX, circleY, circleRadius, rectX, rectY, rectWidth, rectHeight) {

    const closestX = Math.max(rectX, Math.min(circleX, rectX + rectWidth));

    const closestY = Math.max(rectY, Math.min(circleY, rectY + rectHeight));

    const distanceX = circleX - closestX;
    const distanceY = circleY - closestY;
    const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

    return distanceSquared < (circleRadius * circleRadius);
}

function checkAABBCollision(aXMin, aXMax, aYMin, aYMax, bXMin, bXMax, bYMin, bYMax) {
    return aXMax > bXMin && aXMin < bXMax && aYMax > bYMin && aYMin < bYMax;
}

function applyDamageToPlayer(session, playerEntityId, damage, ignoreShield = false) {
    if (session.status !== SESSION_STATES.ACTIVE) return;

    const cm = session.componentManager;
    const health = cm.getComponent(playerEntityId, 'health');
    const armorStats = cm.getComponent(playerEntityId, 'armor_stats');
    if (!health || !armorStats) return;

    if (CONFIG.game.GOD_MODE_ENABLED) return;

    health.lastHitTimestamp = Date.now();

    let remainingDamage = damage;
    if (!ignoreShield) {
        const initialShield = health.shield;
        health.shield = Math.max(0, health.shield - remainingDamage);
        remainingDamage = Math.max(0, remainingDamage - initialShield);
    }

    if (remainingDamage > 0) {
        const absorptionResult = calculateAbsorption(remainingDamage, session, playerEntityId);
        remainingDamage = absorptionResult.finalDamage;
        if (absorptionResult.absorbedAmount > 0) {
            session.gameEvents.push([
                GET.PLAYER_ABSORB_FEEDBACK,
                {[EPK.ABSORBED_AMOUNT]: absorptionResult.absorbedAmount}
            ]);
        }
    }

    const initialArmor = health.armor;
    health.armor = Math.max(0, health.armor - remainingDamage);
    remainingDamage = Math.max(0, remainingDamage - initialArmor);

    if (remainingDamage > 0) {
        health.hull = Math.max(0, health.hull - remainingDamage);
    }

    if (health.hull <= 0) {
        terminateSession(session, 'playerLoose');
    }
}

function applyDamageToEnemy(entityId, damage, session, isCritical = false, options = {}) {
    const cm = session.componentManager;
    const poolManager = session.componentPoolManager;

    const playerHealth = cm.getComponent(session.playerEntityId, 'health');

    if (!playerHealth || playerHealth.hull <= 0) {
        return;
    }

    if (cm.getComponent(entityId, 'indestructible')) {
        if (!cm.getComponent(entityId, 'loot_drop_request')) {
            const request = poolManager.acquire('loot_drop_request');
            request.reason = 'mined';
            cm.addComponent(entityId, 'loot_drop_request', request);
        }
        return;
    }

    const stats = cm.getComponent(entityId, 'stats');
    const statusEffects = cm.getComponent(entityId, 'statusEffects');

    stats.hp -= damage;

    if (!options.suppressEvent) {
        const payload = {
            [EPK.ENEMY_ID]: entityId,
            [EPK.NEW_ENEMY_HP]: Math.max(0, stats.hp),
            [EPK.DAMAGE_AMOUNT]: Math.floor(damage)
        };

        if (isCritical) {
            const now = Date.now();

            if (now > statusEffects.stunImmuneUntil) {

                statusEffects.stunnedUntil = now + CONFIG.game.CRITICAL_HIT_STUN_DURATION_MS;
                statusEffects.stunImmuneUntil = now + CONFIG.game.STUN_IMMUNITY_DURATION_MS;
            }

            payload[EPK.IS_CRITICAL] = 1;
        }

        session.gameEvents.push([GET.ENEMY_DAMAGED, payload]);
    }

    if (stats.hp <= 0) {
        if (cm.getComponent(entityId, 'pending_destruction')) return;
        const isMinion = !!cm.getComponent(entityId, 'minion');

        if (!isMinion) {
            session.killCount++;
        }

        const request = poolManager.acquire('loot_drop_request');
        request.reason = 'killed';
        cm.addComponent(entityId, 'loot_drop_request', request);
        cm.addComponent(entityId, 'pending_destruction', {
            reason: 'killed',
            killCountSnapshot: session.killCount
        });
    }
}

function getPreciseHistoricalBounds(entityId, cm, timestamp, resultBounds) {
    const historyBuffer = cm.getComponent(entityId, 'position_history');
    if (!historyBuffer) return false;

    const {snapshotA, snapshotB} = historyBuffer.findSnapshotsForTime(timestamp);

    if (!snapshotA) return false;

    const referenceSnapshot = snapshotB || snapshotA;

    const t = (snapshotB && snapshotA)
        ? (timestamp - snapshotA.timestamp) / (snapshotB.timestamp - snapshotA.timestamp || 1)
        : 1;

    const centerAx = (snapshotA.xMin + snapshotA.xMax) / 2;
    const centerAy = (snapshotA.yMin + snapshotA.yMax) / 2;
    const centerBx = (snapshotB ? (snapshotB.xMin + snapshotB.xMax) / 2 : centerAx);
    const centerBy = (snapshotB ? (snapshotB.yMin + snapshotB.yMax) / 2 : centerAy);

    const interpolatedX = centerAx + (centerBx - centerAx) * t;
    const interpolatedY = centerAy + (centerBy - centerAy) * t;

    let halfWidth, halfHeight;
    const geo = cm.getComponent(entityId, 'collision_geometry');

    if (geo) {
        if (geo.isCircle) {
            halfWidth = geo.radius;
            halfHeight = geo.radius;
        } else {
            halfWidth = geo.width / 2;
            halfHeight = geo.height / 2;
        }
    } else {
        return false;
    }

    resultBounds.xMin = interpolatedX - halfWidth;
    resultBounds.xMax = interpolatedX + halfWidth;
    resultBounds.yMin = interpolatedY - halfHeight;
    resultBounds.yMax = interpolatedY + halfHeight;

    return true;
}

module.exports = {
    checkCircleRectCollision,
    checkAABBCollision,
    applyDamageToPlayer,
    applyDamageToEnemy,
    getPreciseHistoricalBounds
};
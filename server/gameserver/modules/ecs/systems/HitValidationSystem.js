const CONFIG = require('../../../core/config');
const {applyDamageToEnemy, checkAABBCollision} = require('../../entities/collisionUtils');
const {playerFirePatterns} = require('../../../objects/players/firePatterns');
const {calculatePlayerDamage} = require("../../mechanics/damageCalculator");
const logger = require("../../../core/logger");

class HitValidationSystem {
    constructor() {
        this._bulletHitPos = {x: 0, y: 0};
        this._bulletHitbox = {xMin: 0, yMin: 0, xMax: 0, yMax: 0};
        this._enemyHistoricalBounds = {xMin: 0, xMax: 0, yMin: 0, yMax: 0};
        logger.info('[ECS:HitValidationSystem] Initialized.');
    }

    /**
     * Обрабатывает очередь отчетов о попаданиях для указанной сессии.
     * @param {object} session - Игровая сессия.
     */
    processHitClaims(session) {
        if (!session.hitClaimQueue || session.hitClaimQueue.length === 0) {
            return;
        }

        const claimsToProcess = [...session.hitClaimQueue];
        session.hitClaimQueue = [];

        for (const claim of claimsToProcess) {
            this.validateClaim(session, claim);
        }
    }

    /**
     * Проводит полную, серверно-авторитетную проверку отчета о попадании ("Hit Claim"),
     * полученного от клиента. Использует механизм компенсации задержки (Lag Compensation)
     * путем "перемотки времени" для синхронизации контекста проверки с тем, что видел игрок.
     *
     * @param {object} session - Игровая сессия, содержащая все состояние мира.
     * @param {Array} claim - Массив с данными отчета в формате [originActionId, pelletIndex, enemyId, hitTimestamp].
     */
    validateClaim(session, claim) {

        const [originActionId, pelletIndex, enemyId, hitTimestamp] = claim;

        const logPrefix = `[SERVER_HIT_VALIDATION | actionId: ${originActionId}, enemyId: ${enemyId}]`;

        const cm = session.componentManager;
        const playerRender = cm.getComponent(session.playerEntityId, 'render');

        if (!playerRender) {
            logger.error(`${logPrefix} REJECTED (Internal Error): Player render component not found.`);
            return;
        }

        const serverNow = Date.now();
        const timeDifference = Math.abs(serverNow - hitTimestamp);
        const timeTolerance = session.ping + CONFIG.performance.CLIENT_RENDER_DELAY_MS;
        if (timeDifference > timeTolerance) {
            logger.warn(`${logPrefix} REJECTED (Time): Stale timestamp. Latency: ${timeDifference}ms, Tolerance (ping+const): ${timeTolerance}ms`);
            return;
        }

        const actionHistory = cm.getComponent(session.playerEntityId, 'action_history');
        if (!actionHistory) {
            return;
        }
        const fireAction = actionHistory.get(originActionId);

        if (!fireAction) {
            logger.warn(`${logPrefix} REJECTED (Action): Fire actionId not found in history.`);
            return;
        }

        const realFlightTimeMs = hitTimestamp - fireAction.timestamp;

        if (realFlightTimeMs < 0 || realFlightTimeMs > CONFIG.validation.MAX_FLIGHT_TIME_MS) {
            logger.warn(`${logPrefix} REJECTED (Flight Time): Invalid real flight time ${realFlightTimeMs}ms.`);
            return;
        }

        const weaponParams = this.getWeaponParamsForAction(session, fireAction);
        if (!weaponParams) {
            logger.warn(`${logPrefix} REJECTED (Weapon): Could not determine weapon for actionId.`);
            return;
        }

        let pelletHitSet = fireAction.hitsByPellet.get(pelletIndex);
        if (!pelletHitSet) {
            pelletHitSet = new Set();
            fireAction.hitsByPellet.set(pelletIndex, pelletHitSet);
        }

        const pierceLimit = (weaponParams.bullet && weaponParams.bullet.pierce) || 1;

        if (pelletHitSet.size >= pierceLimit) {
            logger.warn(`${logPrefix} REJECTED (Pierce Limit): Pellet ${pelletIndex} has already hit its maximum of ${pierceLimit} target(s).`);
            return;
        }

        if (pelletHitSet.has(enemyId)) {
            logger.warn(`${logPrefix} REJECTED (Duplicate Target): Pellet ${pelletIndex} has already hit enemy ${enemyId}.`);
            return;
        }

        const bulletTrajectory = this.calculateBulletTrajectory(weaponParams, pelletIndex);
        if (!bulletTrajectory) {
            logger.warn(`${logPrefix} REJECTED (Trajectory): Invalid pelletIndex ${pelletIndex}.`);
            return;
        }

        const flightTimeSec = realFlightTimeMs / 1000.0;
        const bulletHitPos = this._bulletHitPos;
        const bulletHitbox = this._bulletHitbox;

        bulletHitPos.x = fireAction.x + playerRender.size.width / 2 + (bulletTrajectory.velocityX * flightTimeSec);
        bulletHitPos.y = fireAction.y + (bulletTrajectory.velocityY * flightTimeSec);

        const bulletSize = weaponParams.bullet.size;
        const halfWidth = bulletSize.width / 2;
        const halfHeight = bulletSize.height / 2;

        bulletHitbox.xMin = bulletHitPos.x - halfWidth;
        bulletHitbox.xMax = bulletHitPos.x + halfWidth;
        bulletHitbox.yMin = bulletHitPos.y - halfHeight;
        bulletHitbox.yMax = bulletHitPos.y + halfHeight;

        const oneWayLatency = session.ping / 2;
        const totalDesyncMs = oneWayLatency + CONFIG.performance.CLIENT_RENDER_DELAY_MS;

        const timeRewindMs = Math.min(realFlightTimeMs, totalDesyncMs);
        const validationTimestamp = hitTimestamp - timeRewindMs;

        if (validationTimestamp < fireAction.timestamp) {
            logger.warn(`${logPrefix} REJECTED (Temporal Paradox): Validation time (${validationTimestamp}) is earlier than fire time (${fireAction.timestamp}).`);
            return;
        }

        const enemyHistoryComponent = cm.getComponent(enemyId, 'position_history');

        if (!enemyHistoryComponent) {
            return;
        }
        const enemyHistoricalBounds = this._enemyHistoricalBounds;
        const boundsFound = getInterpolatedHistoricalBounds(enemyId, session.componentManager, validationTimestamp, session, enemyHistoricalBounds);

        if (boundsFound && checkAABBCollision(
            bulletHitbox.xMin, bulletHitbox.xMax, bulletHitbox.yMin, bulletHitbox.yMax,
            enemyHistoricalBounds.xMin, enemyHistoricalBounds.xMax,
            enemyHistoricalBounds.yMin, enemyHistoricalBounds.yMax
        )) {

            pelletHitSet.add(enemyId);
            const {finalDamage, isCritical} = calculatePlayerDamage(weaponParams, session);
            applyDamageToEnemy(enemyId, finalDamage, session, isCritical);
        } else {

            logger.warn(
                `${logPrefix} REJECTED (Miss): Bullet missed historical enemy bounds. Details: { ` +
                `flightTimeMs: ${realFlightTimeMs}, ` +
                `fireAction: ${JSON.stringify({
                    x: fireAction.x.toFixed(2),
                    y: fireAction.y.toFixed(2),
                    timestamp: fireAction.timestamp
                })}, ` +
                `calculatedBulletHitPos: ${JSON.stringify({
                    x: bulletHitPos.x.toFixed(2),
                    y: bulletHitPos.y.toFixed(2)
                })}, ` +
                `bulletHitbox: ${JSON.stringify({
                    xMin: bulletHitbox.xMin.toFixed(2),
                    xMax: bulletHitbox.xMax.toFixed(2),
                    yMin: bulletHitbox.yMin.toFixed(2),
                    yMax: bulletHitbox.yMax.toFixed(2)
                })}, ` +
                `enemyHistoricalBounds: ${JSON.stringify(enemyHistoricalBounds)} ` +
                `}`
            );
        }
    }

    getWeaponParamsForAction(session, fireAction) {
        const cm = session.componentManager;
        const inventory = cm.getComponent(session.playerEntityId, 'weapon_inventory');
        if (!inventory) return null;

        const activeSlot = fireAction.activeWeaponSlot || 'weapon1';
        return inventory.weapons[activeSlot]?.params;
    }

    calculateBulletTrajectory(weaponParams, pelletIndex) {
        const patternName = weaponParams.firePattern || 'single';
        const patternHandler = playerFirePatterns[patternName];
        if (!patternHandler) {
            logger.warn(`[HIT_VALIDATION] calculateBulletTrajectory: Unknown pattern handler '${patternName}'`);
            return null;
        }

        let expectedBulletCount = 1;
        if (patternName === 'spread' && weaponParams.firePatternParams) {
            expectedBulletCount = weaponParams.firePatternParams.bulletCount || 1;
        }

        if (pelletIndex < 0 || pelletIndex >= expectedBulletCount) {
            logger.warn(`[HIT_VALIDATION] REJECTED (PelletIndex): Received invalid index ${pelletIndex} for weapon that fires ${expectedBulletCount} bullet(s).`);
            return null;
        }

        const vectors = patternHandler(weaponParams);
        return vectors[pelletIndex];
    }
}

function getInterpolatedHistoricalBounds(entityId, cm, timestamp, session, resultBounds) {
    const historyBuffer = cm.getComponent(entityId, 'position_history');
    if (!historyBuffer) {
        return false;
    }

    const {snapshotA, snapshotB} = historyBuffer.findSnapshotsForTime(timestamp);

    if (!snapshotA) {
        return false;
    }

    if (!snapshotB) {
        resultBounds.xMin = snapshotA.xMin;
        resultBounds.xMax = snapshotA.xMax;
        resultBounds.yMin = snapshotA.yMin;
        resultBounds.yMax = snapshotA.yMax;
        return true;
    }

    const sweptXMin = Math.min(snapshotA.xMin, snapshotB.xMin);
    const sweptXMax = Math.max(snapshotA.xMax, snapshotB.xMax);
    const sweptYMin = Math.min(snapshotA.yMin, snapshotB.yMin);
    const sweptYMax = Math.max(snapshotA.yMax, snapshotB.yMax);

    const deltaTime = (snapshotB.timestamp - snapshotA.timestamp) / 1000.0;
    if (deltaTime <= 0) {
        resultBounds.xMin = sweptXMin;
        resultBounds.xMax = sweptXMax;
        resultBounds.yMin = sweptYMin;
        resultBounds.yMax = sweptYMax;
        return true;
    }

    const centerAx = (snapshotA.xMin + snapshotA.xMax) / 2;
    const centerAy = (snapshotA.yMin + snapshotA.yMax) / 2;
    const centerBx = (snapshotB.xMin + snapshotB.xMax) / 2;
    const centerBy = (snapshotB.yMin + snapshotB.yMax) / 2;

    const velocityX = (centerBx - centerAx) / deltaTime;
    const velocityY = (centerBy - centerAy) / deltaTime;

    const latencySec = (Math.min(session.ping, 500) / 2) / 1000.0;

    const dynamicPaddingX = Math.abs(velocityX * latencySec);
    const dynamicPaddingY = Math.abs(velocityY * latencySec);

    const STATIC_PADDING = 15.0;

    const MAX_ALLOWED_PADDING = 150.0;

    const totalPaddingX = Math.min(dynamicPaddingX + STATIC_PADDING, MAX_ALLOWED_PADDING);
    const totalPaddingY = Math.min(dynamicPaddingY + STATIC_PADDING, MAX_ALLOWED_PADDING);

    resultBounds.xMin = sweptXMin - totalPaddingX;
    resultBounds.xMax = sweptXMax + totalPaddingX;
    resultBounds.yMin = sweptYMin - totalPaddingY;
    resultBounds.yMax = sweptYMax + totalPaddingY;

    return true;
}

module.exports = new HitValidationSystem();
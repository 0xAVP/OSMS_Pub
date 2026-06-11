const System = require('./System');
const logger = require("../../../core/logger");

class BehaviorSystemV2 extends System {
    constructor() {
        super();
        logger.info('[ECS:BehaviorSystemV2] Initialized.');
    }

    update(entityId, cm, delta, session) {
        const behavior = cm.getComponent(entityId, 'behavior');
        const position = cm.getComponent(entityId, 'position');
        const velocity = cm.getComponent(entityId, 'velocity');

        if (!behavior || !behavior.script || !position || !velocity) {
            return;
        }

        if (behavior.currentStateIndex === undefined) {
            this._initializeScript(behavior);
        }

        const script = behavior.script;
        const currentStateDef = script[behavior.currentStateIndex];

        if (!currentStateDef) {
            velocity.x = 0;
            velocity.y = 0;
            return;
        }

        this.entityId = entityId;

        if (!behavior.stateInitialized) {
            this._onStateEnter(behavior, currentStateDef, position, session, cm);
            behavior.stateInitialized = true;
        }

        behavior.stateTimer += delta;

        if (currentStateDef.triggers) {
            for (const trigger of currentStateDef.triggers) {
                if (this._checkTrigger(trigger, entityId, cm, session, behavior)) {
                    this._transitionToState(behavior, trigger.newStateIndex);
                    return;
                }
            }
        }

        if (currentStateDef.duration && behavior.stateTimer >= currentStateDef.duration) {
            const nextIndex = currentStateDef.nextStateIndex !== undefined
                ? currentStateDef.nextStateIndex
                : behavior.currentStateIndex + 1;
            this._transitionToState(behavior, nextIndex);
            return;
        }

        if (currentStateDef.movement) {
            this._executeMovement(currentStateDef.movement, velocity, position, session, behavior, delta);
        }
    }

    _initializeScript(behavior) {
        behavior.currentStateIndex = 0;
        behavior.stateTimer = 0;
        behavior.stateInitialized = false;
        behavior.stateData = {};
    }

    _onStateEnter(behavior, stateDef, position, session, cm) {

        if (!stateDef.onEnter || !stateDef.onEnter.action) {
            return;
        }

        const action = stateDef.onEnter.action;
        const params = stateDef.onEnter.params || {};

        switch (action) {
            case 'set_initial_rotation': {
                const minAngle = params.minAngle || 0;
                const maxAngle = params.maxAngle || 360;
                position.rotation = (minAngle + Math.random() * (maxAngle - minAngle)) * (Math.PI / 180);
                break;
            }
            case 'set_orbit_center': {
                const orbitCenter = {
                    x: position.x - (params.offsetX || 0),
                    y: position.y - (params.offsetY || 0)
                };
                behavior.stateData.orbitCenter = orbitCenter;
                behavior.stateData.orbitAngle = Math.atan2(position.y - orbitCenter.y, position.x - orbitCenter.x);
                break;
            }
            case 'generate_random_point_in_zone': {

                const zone = params.zone;
                if (zone) {
                    const xRange = (zone.xMaxPercent || 0) - (zone.xMinPercent || 0);
                    const yRange = (zone.yMaxPercent || 0) - (zone.yMinPercent || 0);

                    const randomXPercent = (zone.xMinPercent || 0) + Math.random() * xRange;
                    const randomYPercent = (zone.yMinPercent || 0) + Math.random() * yRange;

                    behavior.stateData.currentTargetPoint = {
                        x: session.width * randomXPercent,
                        y: session.height * randomYPercent,
                    };
                }
                break;
            }
            case 'switch_weapon': {
                const weaponState = cm.getComponent(this.entityId, 'weaponState');
                if (!weaponState) break;
                const {weaponIndex} = params;
                if (weaponIndex !== undefined && weaponState.weapons[weaponIndex]) {

                    weaponState.requestedWeaponIndex = weaponIndex;
                }
                break;
            }
            case 'spawn_entity': {

                const {typeId, offsetX = 0, offsetY = 0, spawnMode, safeRadius = 300, maxCount} = params;

                if (maxCount !== undefined) {

                    const currentEnemies = session.activeEntities.enemies.size;

                    if (currentEnemies >= maxCount) {

                        break;
                    }
                }

                logger.info(`[BehaviorSystem] Сущность ${this.entityId} запросила спавн typeId: ${typeId}`);
                if (!typeId) {
                    logger.warn(`[BehaviorSystemV2] Action 'spawn_entity' for entity ${this.entityId} is missing 'typeId' in params.`);
                    break;
                }

                let spawnPosition;

                if (spawnMode === 'global_random') {
                    const playerPos = session.componentManager.getComponent(session.playerEntityId, 'position');
                    const scale = session.sizeScaleFactor || 1.0;
                    const scaledSafeRadius = safeRadius * scale;
                    const safeRadiusSq = scaledSafeRadius * scaledSafeRadius;

                    for (let i = 0; i < 10; i++) {
                        spawnPosition = {
                            x: session.width * (0.1 + Math.random() * 0.8),
                            y: session.height * (0.1 + Math.random() * 0.8)
                        };
                        if (!playerPos) break;
                        const dx = spawnPosition.x - playerPos.x;
                        const dy = spawnPosition.y - playerPos.y;
                        if ((dx * dx + dy * dy) > safeRadiusSq) {
                            break;
                        }
                    }
                } else {
                    spawnPosition = {
                        x: position.x + offsetX,
                        y: position.y + offsetY
                    };
                }

                const newEntityId = session.entityManager.createEntity();
                cm.addComponent(newEntityId, 'spawn_request', {
                    typeId: typeId,
                    position: spawnPosition
                });
                break;
            }

            case 'mark_for_destruction': {

                cm.addComponent(this.entityId, 'pending_destruction', {
                    reason: params.reason || 'behavior_script'
                });
                break;
            }
            default:
                logger.warn(`[BehaviorSystemV2] Unknown onEnter action: "${action}"`);
                break;
        }
    }

    _transitionToState(behavior, newIndex) {
        behavior.currentStateIndex = newIndex;
        behavior.stateTimer = 0;
        behavior.stateInitialized = false;
        behavior.stateData = {};
    }

    _checkTrigger(trigger, entityId, cm, session, behavior) {
        const currentPos = cm.getComponent(entityId, 'position');
        if (!currentPos) return false;

        const scaleFactor = session.sizeScaleFactor || 1.0;

        switch (trigger.condition) {
            case 'distance_to_target_less_than': {
                const movement = behavior.script[behavior.currentStateIndex]?.movement;
                if (!movement || !movement.target) return false;

                const targetPos = this._resolveTargetPosition(movement.target, session, currentPos, behavior);
                if (!targetPos) return false;

                const dx = targetPos.x - currentPos.x;
                const dy = targetPos.y - currentPos.y;
                const distanceSq = dx * dx + dy * dy;

                const threshold = trigger.value * scaleFactor;
                const thresholdSq = threshold * threshold;

                return distanceSq < thresholdSq;
            }
            case 'player_is_behind': {
                const playerPos = cm.getComponent(session.playerEntityId, 'position');
                if (!playerPos) return false;
                return playerPos.x > currentPos.x;
            }
            case 'distance_to_player': {
                const playerPos = cm.getComponent(session.playerEntityId, 'position');
                if (!playerPos) return false;

                const dx = playerPos.x - currentPos.x;
                const dy = playerPos.y - currentPos.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (trigger.less_than !== undefined) {
                    const threshold = trigger.less_than * scaleFactor;
                    return distance < threshold;
                }
                if (trigger.greater_than !== undefined) {
                    const threshold = trigger.greater_than * scaleFactor;
                    return distance > threshold;
                }
                return false;
            }
            case 'player_in_beam': {
                return this._isPlayerInBeam(trigger, entityId, cm, session);
            }
            case 'player_outside_beam': {
                return !this._isPlayerInBeam(trigger, entityId, cm, session);
            }
            case 'hp_percent_less_than': {
                const stats = cm.getComponent(entityId, 'stats');
                if (!stats || stats.maxHp <= 0) return false;

                const currentPercent = (stats.hp / stats.maxHp) * 100;
                return currentPercent < trigger.value;
            }
            default:
                return false;
        }
    }

    _executeMovement(movement, velocity, position, session, behavior, delta) {
        const speed = movement.speed || behavior.baseSpeed || 100;
        switch (movement.type) {
            case 'seek': {

                const targetPos = this._resolveTargetPosition(movement.target, session, position, behavior);
                if (!targetPos) return;
                const dx = targetPos.x - position.x;
                const dy = targetPos.y - position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 1) {
                    velocity.x = 0;
                    velocity.y = 0;
                    return;
                }
                velocity.x = (dx / distance) * speed;
                velocity.y = (dy / distance) * speed;
                break;
            }
            case 'linear': {
                const angleRad = (movement.target.angle * Math.PI) / 180;
                velocity.x = Math.cos(angleRad) * speed;
                velocity.y = Math.sin(angleRad) * speed;
                break;
            }
            case 'pingpong': {
                const params = movement.params || {};
                const maxVerticalSpeed = params.maxVerticalSpeed || 150;
                if (behavior.stateData.oscillationDirection === undefined) {
                    behavior.stateData.oscillationDirection = 1;
                }
                const margin = 10;
                if (position.y >= session.height - margin && behavior.stateData.oscillationDirection > 0) {
                    behavior.stateData.oscillationDirection = -1;
                } else if (position.y <= margin && behavior.stateData.oscillationDirection < 0) {
                    behavior.stateData.oscillationDirection = 1;
                }
                velocity.y = maxVerticalSpeed * behavior.stateData.oscillationDirection;
                break;
            }
            case 'orbit': {
                const params = movement.params || {};
                const center = behavior.stateData.orbitCenter;

                if (!center || behavior.stateData.orbitAngle === undefined) {
                    return;
                }

                const radius = params.radius || 150;
                const clockwise = params.clockwise !== false;

                let currentAngle = behavior.stateData.orbitAngle;

                currentAngle += (clockwise ? 1 : -1) * (speed / radius) * delta;

                behavior.stateData.orbitAngle = currentAngle;

                const targetX = center.x + Math.cos(currentAngle) * radius;
                const targetY = center.y + Math.sin(currentAngle) * radius;

                velocity.x = (targetX - position.x) * 2;
                velocity.y = (targetY - position.y) * 2;
                break;
            }
            case 'rotate': {
                const params = movement.params || {};

                let speedDeg = 0;

                const currentDef = behavior.script[behavior.currentStateIndex];

                if (typeof params.rotationSpeed === 'object' && currentDef && currentDef.duration) {

                    const start = params.rotationSpeed.start || 0;
                    const end = params.rotationSpeed.end || 0;

                    const t = Math.min(1, behavior.stateTimer / currentDef.duration);

                    speedDeg = start + (end - start) * t;
                } else {

                    speedDeg = params.rotationSpeed || 15;
                }

                const rotationSpeedRad = speedDeg * (Math.PI / 180);
                position.rotation = (position.rotation || 0) + rotationSpeedRad * delta;

                velocity.x = 0;
                velocity.y = 0;
                break;
            }
            case 'track_player': {
                const playerPosition = session.componentManager.getComponent(session.playerEntityId, 'position');
                if (!playerPosition) break;

                const params = movement.params || {};
                const rotationSpeedRad = (params.rotationSpeed || 90) * (Math.PI / 180);

                const dx = playerPosition.x - position.x;
                const dy = playerPosition.y - position.y;
                const targetAngle = Math.atan2(dy, dx);

                let currentAngle = position.rotation || 0;

                let angleDiff = targetAngle - currentAngle;
                while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

                const maxRotationThisFrame = rotationSpeedRad * delta;

                const rotationAmount = Math.max(-maxRotationThisFrame, Math.min(maxRotationThisFrame, angleDiff));

                position.rotation = currentAngle + rotationAmount;

                velocity.x = 0;
                velocity.y = 0;
                break;
            }
            case 'stop': {
                velocity.x = 0;
                velocity.y = 0;
                break;
            }
        }
        if (behavior.boundaryBehavior === 'stay_in_bounds') {
            this._applyWallAvoidance(position, velocity, session, speed, delta);
        }
    }

    _applyWallAvoidance(position, velocity, session, speed, delta) {

        const margin = 50;

        const minX = margin;
        const maxX = session.width - margin;
        const minY = margin;
        const maxY = session.height - margin;

        const criticalMargin = -50;
        if (position.x < criticalMargin || position.x > session.width - criticalMargin ||
            position.y < criticalMargin || position.y > session.height - criticalMargin) {

            const centerX = session.width / 2;
            const centerY = session.height / 2;
            const dx = centerX - position.x;
            const dy = centerY - position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 0) {
                velocity.x = (dx / dist) * (speed * 1.5);
                velocity.y = (dy / dist) * (speed * 1.5);
            }
            return;
        }

        const repulsionSpeed = speed * 0.8;

        if (position.x < minX) {

            const penetration = (minX - position.x) / margin;

            if (velocity.x < 0) {
                velocity.x = 0;
            }

            velocity.x += repulsionSpeed * penetration;
        } else if (position.x > maxX) {
            const penetration = (position.x - maxX) / margin;
            if (velocity.x > 0) {
                velocity.x = 0;
            }
            velocity.x -= repulsionSpeed * penetration;
        }

        if (position.y < minY) {
            const penetration = (minY - position.y) / margin;
            if (velocity.y < 0) {
                velocity.y = 0;
            }
            velocity.y += repulsionSpeed * penetration;
        } else if (position.y > maxY) {
            const penetration = (position.y - maxY) / margin;
            if (velocity.y > 0) {
                velocity.y = 0;
            }
            velocity.y -= repulsionSpeed * penetration;
        }
    }

    _resolveTargetPosition(target, session, selfPosition, behavior) {
        if (behavior.stateData.currentTargetPoint) {
            return behavior.stateData.currentTargetPoint;
        }

        switch (target.type) {
            case 'player':
                return session.componentManager.getComponent(session.playerEntityId, 'position');
            case 'point':
                return {x: target.x, y: target.y};
            case 'relative_point': {
                const finalX = target.xPercent !== undefined
                    ? session.width * target.xPercent
                    : selfPosition.x + (target.dx || 0);

                const finalY = target.yPercent !== undefined
                    ? session.height * target.yPercent
                    : selfPosition.y + (target.dy || 0);

                return {x: finalX, y: finalY};
            }
            default:
                return null;
        }
    }

    _isPlayerInBeam(trigger, entityId, cm, session) {
        const turretPos = cm.getComponent(entityId, 'position');
        const playerPos = cm.getComponent(session.playerEntityId, 'position');

        if (!turretPos || !playerPos) {
            return false;
        }

        const params = trigger.params || {};
        const beamWidth = params.beamWidth || 30;
        const beamRange = params.beamRange || 800;
        const scaleFactor = session.sizeScaleFactor || 1.0;
        const scaledBeamRange = beamRange * scaleFactor;

        const turretAngle = turretPos.rotation || 0;

        const playerRelativeX = (playerPos.x - turretPos.x) * Math.cos(-turretAngle) - (playerPos.y - turretPos.y) * Math.sin(-turretAngle);
        const playerRelativeY = (playerPos.x - turretPos.x) * Math.sin(-turretAngle) + (playerPos.y - turretPos.y) * Math.cos(-turretAngle);

        const isInRange = playerRelativeX >= 0 && playerRelativeX <= scaledBeamRange;
        if (!isInRange) {
            return false;
        }

        const isAligned = Math.abs(playerRelativeY) <= (beamWidth / 2);
        if (!isAligned) {
            return false;
        }

        return true;
    }
}

module.exports = new BehaviorSystemV2();
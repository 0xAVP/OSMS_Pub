const CONFIG = require('../core/config');
const {gameSessions} = require('./session/sessions');
const {SESSION_STATES} = require('./session/sessionStates');
const {MK, MT} = require('../core/gameStateKeys');
const {safeSend} = require("../utils/networkUtils");
const GeometryUpdateSystem = require('./ecs/systems/GeometryUpdateSystem');
const replicationSystem = require('./replicationSystem');
const cleanupSystem = require('./cleanupSystem');
const inputSystem = require('./InputSystem');
const playerWeaponSwitchSystem = require('./ecs/systems/PlayerWeaponSwitchSystem');
const entitySimulationSystem = require('./ecs/systems/EntitySimulationSystem');
const energyRegenSystem = require('./ecs/systems/EnergyRegenSystem');
const shieldRegenSystem = require('./ecs/systems/ShieldRegenSystem');
const playerBoundarySystem = require('./ecs/systems/PlayerBoundarySystem.js');
const boundarySystem = require('./ecs/systems/BoundarySystem');
const destructionEventSystem = require('./destructionEventSystem');
const collisionDetectionSystem = require('./ecs/systems/CollisionDetectionSystem');
const collisionResolutionSystem = require('./ecs/systems/CollisionResolutionSystem');
const hitValidationSystem = require('./ecs/systems/HitValidationSystem');
const historySystem = require('./ecs/systems/HistorySystem');
const buffLifecycleSystem = require('./mechanics/BuffLifecycleSystem');
const statRecalculationSystem = require('./ecs/systems/StatRecalculationSystem');
const onKillEffectSystem = require('./ecs/systems/OnKillEffectSystem');
const lootDropSystem = require('./ecs/systems/LootDropSystem');
const spawnSystem = require('./ecs/systems/SpawnSystem');
const lifetimeSystem = require('./ecs/systems/LifetimeSystem');
const offscreenCleanupSystem = require('./ecs/systems/OffscreenCleanupSystem');
const logger = require("../core/logger");

class GameLoopManager {
    constructor() {
        this.pingInterval = null;
        this.mainLoopInterval = null;
        this.lastTickTime = Date.now();
        this.accumulator = 0;
        this.FIXED_STEP_MS = CONFIG.server.UPDATE_INTERVAL_MS;
        this.FIXED_DELTA_SEC = this.FIXED_STEP_MS / 1000.0;
    }

    start() {
        this.lastTickTime = Date.now();
        this.mainLoopInterval = setInterval(() => this.tick(), this.FIXED_STEP_MS);
        this.pingInterval = setInterval(() => this.sendPings(), CONFIG.server.PING_INTERVAL_MS);
    }

    stop() {
        clearInterval(this.mainLoopInterval);
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    updateSession(session, now) {
        if (!session.componentManager) return;
        const cm = session.componentManager;

        inputSystem.process(session, session.ws);
        playerWeaponSwitchSystem.process(session);

        buffLifecycleSystem.update(session);
        statRecalculationSystem.process(session);

        if (session.status === SESSION_STATES.ACTIVE) {
            spawnSystem.process(session);
            entitySimulationSystem.process(session, now, this.FIXED_DELTA_SEC);
            lifetimeSystem.update(session);
            playerBoundarySystem.update(cm, session);
            energyRegenSystem.update(session, this.FIXED_DELTA_SEC);
            shieldRegenSystem.update(session, this.FIXED_DELTA_SEC);
            boundarySystem.update(session);
        }

        historySystem.update(session, now);

        if (session.stateManager) {
            session.stateManager.update(this.FIXED_DELTA_SEC);
        }

        if (session.status === SESSION_STATES.ACTIVE) {
            GeometryUpdateSystem.update(session);
            hitValidationSystem.processHitClaims(session);
            collisionDetectionSystem.update(session);
            collisionResolutionSystem.update(session);
        }

        onKillEffectSystem.process(session);
        lootDropSystem.process(session);
        destructionEventSystem.process(session);
        cleanupSystem.process(session);
    }

    tick() {
        const now = Date.now();
        const frameTime = now - this.lastTickTime;
        this.lastTickTime = now;
        this.accumulator += frameTime;

        let simulationTime = now - this.accumulator;

        while (this.accumulator >= this.FIXED_STEP_MS) {
            gameSessions.forEach((session) => {

                if (!session ||
                    session.status === SESSION_STATES.ENDING ||
                    session.status === SESSION_STATES.EXITING ||
                    session.status === SESSION_STATES.INITIALIZING ||
                    session.status === SESSION_STATES.PAUSED_DISCONNECTED ||
                    session.status === 'terminated' ||
                    !session.componentManager
                ) {
                    return;
                }
                this.updateSession(session, simulationTime);
            });
            this.accumulator -= this.FIXED_STEP_MS;
            simulationTime += this.FIXED_STEP_MS;
        }

        gameSessions.forEach((session) => {
            if (!session ||
                session.status === SESSION_STATES.ENDING ||
                session.status === SESSION_STATES.EXITING ||
                session.status === SESSION_STATES.INITIALIZING ||
                session.status === SESSION_STATES.PAUSED_DISCONNECTED ||
                session.status === 'terminated' ||
                !session.componentManager
            ) {
                return;
            }

            replicationSystem.generateAndSendState(session);

            const realDeltaSec = frameTime / 1000.0;
            session.countdownAccumulator = (session.countdownAccumulator || 0) + realDeltaSec;
            const countdownIntervalSeconds = CONFIG.server.GAME_TIME_UPDATE_INTERVAL_MS / 1000;

            if (session.countdownAccumulator >= countdownIntervalSeconds) {
                this.countdownTask(session, now);
                offscreenCleanupSystem.update(session);
                session.countdownAccumulator -= countdownIntervalSeconds;
            }

            session.lastUpdate = now;
        });
    }

    countdownTask(session, now) {
        try {

            if ((session.status === SESSION_STATES.ACTIVE || session.status === SESSION_STATES.POST_BOSS_DELAY) && session.countdown && !session.countdown.isPreparation) {

                if (!session.countdown.startTime) {
                    session.countdown.startTime = now;
                }

                session.countdown.gameTime = Math.floor((now - session.countdown.startTime) / 1000);

            }
        } catch (error) {
            logger.warn(`Error in game time countdown for session ${session?.sessionId || 'unknown'}: ${error.message}`);
        }
    }

    sendPings() {
        gameSessions.forEach((session) => {
            if (session && session.ws.readyState === WebSocket.OPEN && session.status !== SESSION_STATES.PAUSED_DISCONNECTED) {
                session.lastPingSent = Date.now();

                const pingMessage = {
                    [MK.TYPE]: MT.PING,
                    [MK.PAYLOAD]: {ping: Math.round(session.ping || 0)}
                };

                safeSend(session.ws, pingMessage);
            }
        });
    }
}

module.exports = new GameLoopManager();
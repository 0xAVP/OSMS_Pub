const BaseState = require('./BaseState');
const {safeSend} = require('../../../utils/networkUtils');
const WebSocket = require('ws');
const {MK, MT} = require('../../../core/gameStateKeys');
const logger = require("../../../core/logger");
const {SESSION_STATES} = require("../../session/sessionStates");

class BossFightState extends BaseState {
    constructor(stateManager) {
        super('BossFight', stateManager);
        this.bossSpawned = false;
        this.bossEntityId = null;
    }

    _selectBossFromPool(stageConfig) {

        if (stageConfig.bossPool && Array.isArray(stageConfig.bossPool) && stageConfig.bossPool.length > 0) {
            const pool = stageConfig.bossPool;
            if (pool.length === 1) {
                return pool[0].type;
            }
            const totalWeight = pool.reduce((sum, boss) => sum + boss.weight, 0);
            let randomRoll = Math.random() * totalWeight;
            for (const boss of pool) {
                randomRoll -= boss.weight;
                if (randomRoll <= 0) {
                    return boss.type;
                }
            }
            return pool[0].type;
        }
        return null;
    }

    onEnter() {
        this.session.status = SESSION_STATES.ACTIVE;
        this.bossSpawned = false;
        this.bossEntityId = null;
        this.session.isBossWave = true;

        const stage = this.session.currentStage;
        const bossTypeId = this._selectBossFromPool(stage);

        if (!bossTypeId) {
            logger.warn(`[BossFightState] Сессия ${this.session.sessionId}: Пул боссов для этапа ${this.session.currentStageNumber} не сконфигурирован или пуст. Пропускаем...`);
            this.stateManager.transitionTo('PostBossDelay');
            return;
        }

        const em = this.session.entityManager;
        const cm = this.session.componentManager;

        const bossEntityId = em.createEntity();
        this.bossEntityId = bossEntityId;

        cm.addComponent(bossEntityId, 'spawn_request', {typeId: bossTypeId});

        this.bossSpawned = true;

        if (this.session.ws.readyState === WebSocket.OPEN) {
            safeSend(this.session.ws, {
                [MK.TYPE]: MT.BOSS_SPAWNED,
                [MK.PAYLOAD]: {bossType: bossTypeId, stageNumber: this.session.currentStageNumber}
            });
        }
    }

    onUpdate(delta) {

        if (this.bossSpawned && this.bossEntityId !== null) {
            const isBossAlive = this.session.activeEntities.enemies.has(this.bossEntityId);

            if (!isBossAlive) {
                logger.info(`[BossFightState] Сессия ${this.session.sessionId}: Босс (ID: ${this.bossEntityId}) уничтожен. Переход к зачистке.`);
                this.stateManager.transitionTo('PostBossDelay');
            }
        }
    }

    onExit() {
        this.session.isBossWave = false;
        this.bossEntityId = null;
    }
}

module.exports = BossFightState;
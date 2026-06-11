const BaseState = require('./BaseState');
const energyRegenSystem = require('../../ecs/systems/EnergyRegenSystem');
const shieldRegenSystem = require('../../ecs/systems/ShieldRegenSystem');
const {SESSION_STATES} = require('../../session/sessionStates');
const {safeSend} = require('../../../utils/networkUtils');
const WebSocket = require('ws');
const {MK, MT} = require('../../../core/gameStateKeys');

class PostBossDelayState extends BaseState {
    constructor(stateManager) {
        super('PostBossDelay', stateManager);
        this.delayDuration = 5;
        this.countdown = 0;
        this.lastMessageTime = 0;
    }

    onEnter() {
        this.countdown = this.delayDuration;
        this.session.status = SESSION_STATES.POST_BOSS_DELAY;

        this.clearRemnants();

        this.sendDelayMessage();
    }

    onUpdate(delta) {
        this.countdown -= delta;

        if (this.countdown <= 0) {
            this.stateManager.transitionTo('StageTransition');
            return;
        }

        energyRegenSystem.update(this.session, delta);
        shieldRegenSystem.update(this.session, delta);

        if (Date.now() - this.lastMessageTime >= 1000) {
            this.sendDelayMessage();
        }
    }

    onExit() {
    }

    sendDelayMessage() {
        if (this.session.ws.readyState !== WebSocket.OPEN) return;
        this.lastMessageTime = Date.now();
        safeSend(this.session.ws, {
            [MK.TYPE]: MT.POST_BOSS_DELAY,
            [MK.PAYLOAD]: {remainingTime: Math.ceil(this.countdown)}
        });
    }

    /**
     * Очищает арену от пуль и всех оставшихся врагов (миньонов).
     */
    clearRemnants() {
        const cm = this.session.componentManager;
        const destroyReason = {reason: 'stage_clear'};

        for (const entityId of this.session.activeEntities.enemyBullets) {
            if (!cm.getComponent(entityId, 'pending_destruction')) {
                cm.addComponent(entityId, 'pending_destruction', destroyReason);
            }
        }

        for (const entityId of this.session.activeEntities.enemies) {

            if (!cm.getComponent(entityId, 'pending_destruction')) {

                cm.addComponent(entityId, 'pending_destruction', destroyReason);
            }
        }
    }
}

module.exports = PostBossDelayState;
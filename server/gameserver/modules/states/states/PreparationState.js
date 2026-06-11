const BaseState = require('./BaseState');
const CONFIG = require('../../../core/config');
const {SESSION_STATES} = require('../../session/sessionStates');
const WebSocket = require('ws');
const {MK, MT} = require('../../../core/gameStateKeys');
const {safeSend} = require("../../../utils/networkUtils");

class PreparationState extends BaseState {
    constructor(stateManager) {
        super('Preparation', stateManager);
        this.countdown = 0;
        this.lastSentTime = -1;
    }

    onEnter() {
        this.countdown = CONFIG.game.PREPARATION_COUNTDOWN_MS / 1000.0;
        this.lastSentTime = -1;

        this.session.countdown.isPreparation = true;
        this.session.status = SESSION_STATES.PREPARATION;

        this.sendCountdownMessage();
    }

    onUpdate(delta) {
        this.countdown -= delta;

        const currentTimeToSend = Math.ceil(this.countdown);
        if (currentTimeToSend !== this.lastSentTime) {

            this.sendCountdownMessage();
        }
    }

    onExit() {

    }

    sendCountdownMessage() {
        if (this.session.ws.readyState !== WebSocket.OPEN) return;

        const timeToSend = Math.ceil(this.countdown);

        if (timeToSend <= 0) {

            if (this.stateManager.currentState === this) {
                this.stateManager.transitionTo('StageReady');
            }
            return;
        }

        if (timeToSend === this.lastSentTime) {
            return;
        }
        this.lastSentTime = timeToSend;

        safeSend(this.session.ws, {
            [MK.TYPE]: MT.COUNTDOWN,
            [MK.PAYLOAD]: {
                isPreparation: true,
                gameTime: timeToSend
            }
        });
    }
}

module.exports = PreparationState;
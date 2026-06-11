const BaseState = require('./BaseState');
const {safeSend} = require('../../../utils/networkUtils');
const {MK, MT} = require('../../../core/gameStateKeys');
const WebSocket = require('ws');

const GRACE_PERIOD_MS = 250;

class StageReadyState extends BaseState {
    constructor(stateManager) {
        super('StageReady', stateManager);
        this.transitionTimer = null;
    }

    onEnter() {

        if (this.session.ws.readyState === WebSocket.OPEN) {
            safeSend(this.session.ws, {
                [MK.TYPE]: MT.COUNTDOWN,
                [MK.PAYLOAD]: {isPreparation: false, gameTime: 0}
            });
        }

        this.transitionTimer = setTimeout(() => {

            if (this.stateManager.currentState === this) {
                this.stateManager.transitionTo('WaveInProgress');
            }
        }, GRACE_PERIOD_MS);
    }

    onUpdate(delta) {

    }

    onExit() {

        if (this.transitionTimer) {
            clearTimeout(this.transitionTimer);
            this.transitionTimer = null;
        }
    }
}

module.exports = StageReadyState;
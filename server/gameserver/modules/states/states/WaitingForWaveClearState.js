const BaseState = require('./BaseState');
const {safeSend} = require('../../../utils/networkUtils');
const WebSocket = require('ws');
const {MK, MT} = require('../../../core/gameStateKeys');

class WaitingForWaveClearState extends BaseState {
    constructor(stateManager) {
        super('WaitingForWaveClear', stateManager);
        this.lastEnemyCount = -1;
    }

    onEnter() {
        this.session.isLastStageWave = true;

        this.lastEnemyCount = this.session.activeEntities.enemies.size;

        console.log(`[WaitingForWaveClearState] Сессия ${this.session.sessionId}: Ожидание зачистки ${this.lastEnemyCount} врагов.`);
        this.sendClearMessage();
    }

    onUpdate(delta) {
        const enemyCount = this.session.activeEntities.enemies.size;

        if (enemyCount === 0) {
            this.stateManager.transitionTo('BossFight');
            return;
        }

        if (enemyCount !== this.lastEnemyCount) {
            this.lastEnemyCount = enemyCount;
            this.sendClearMessage();
        }
    }

    onExit() {

        this.session.isLastStageWave = false;

    }

    sendClearMessage() {
        if (this.session.ws.readyState !== WebSocket.OPEN) return;

        safeSend(this.session.ws, {
            [MK.TYPE]: MT.LAST_WAVE_CONTINUING,
            [MK.PAYLOAD]: {
                stageNumber: this.session.currentStageNumber,
                remainingEnemies: this.lastEnemyCount
            }
        });
    }
}

module.exports = WaitingForWaveClearState;
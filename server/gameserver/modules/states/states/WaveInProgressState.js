const BaseState = require('./BaseState');
const {stageConfig, default_stage} = require('../configs/stageConfig');
const {safeSend} = require('../../../utils/networkUtils');
const WebSocket = require('ws');
const {MK, MT} = require('../../../core/gameStateKeys');
const {SESSION_STATES} = require('../../session/sessionStates');

class WaveInProgressState extends BaseState {
    constructor(stateManager) {
        super('WaveInProgress', stateManager);
        this.stageTimeElapsed = 0;
    }

    onEnter() {
        this.session.status = SESSION_STATES.ACTIVE;
        this.stageTimeElapsed = 0;
        this.session.countdown.isPreparation = false;

        let stage = stageConfig.find(s => s.stage === this.session.currentStageNumber);

        if (!stage) {

            stage = {...default_stage};
            stage.stage = this.session.currentStageNumber;
        }

        this.session.currentStage = stage;
        this.session.currentWaveNumber = 0;
        this.session.lastWave = -1;
    }

    onUpdate(delta) {
        this.stageTimeElapsed += delta;
        const stage = this.session.currentStage;
        if (!stage || !stage.waves || stage.waves.length === 0) return;

        let currentWaveData = this.getCurrentWaveData();

        if (!currentWaveData) {
            this.stateManager.transitionTo('WaitingForWaveClear');
            return;
        }

        if (this.session.currentWaveNumber !== this.session.lastWave) {
            this.session.lastWave = this.session.currentWaveNumber;

            this.session.currentWave = currentWaveData;

            const minEnemies = stage.spawnConfig.amount ? stage.spawnConfig.amount[0] : 10;
            const maxEnemies = stage.spawnConfig.amount ? stage.spawnConfig.amount[1] : 20;

            this.session.currentEnemies = currentWaveData.enemies?.types || stage.enemies || [];
            this.session.maxActiveEnemies = Math.floor(Math.random() * (maxEnemies - minEnemies + 1)) + minEnemies;
            this.session.currentSpawnRate = stage.spawnConfig.spawnRate || 1000;

            this.sendWaveMessage(currentWaveData.duration);
        }
    }

    onExit() {

    }

    /**
     * Вычисляет текущую активную волну на основе прошедшего времени.
     * @returns {object|null} Объект с данными о волне или null, если все волны прошли.
     */
    getCurrentWaveData() {
        let waveStartTime = 0;
        for (const stageWave of this.session.currentStage.waves) {
            const duration = stageWave.duration || 30;
            const waveEndTime = waveStartTime + duration;

            if (this.stageTimeElapsed >= waveStartTime && this.stageTimeElapsed < waveEndTime) {
                this.session.currentWaveNumber = stageWave.wave;

                return stageWave;
            }
            waveStartTime += duration;
        }
        return null;
    }

    sendWaveMessage(duration) {
        if (this.session.ws.readyState !== WebSocket.OPEN) return;

        safeSend(this.session.ws, {
            [MK.TYPE]: MT.WAVE,
            [MK.PAYLOAD]: {
                waveNumber: this.session.currentWaveNumber,
                stageNumber: this.session.currentStageNumber,
                maxActiveEnemies: this.session.maxActiveEnemies,
                spawnRate: this.session.currentSpawnRate,
                duration: duration
            }
        });

    }
}

module.exports = WaveInProgressState;
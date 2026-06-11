const PreparationState = require('./states/PreparationState');
const StageReadyState = require('./states/StageReadyState');
const WaveInProgressState = require('./states/WaveInProgressState');
const WaitingForWaveClearState = require('./states/WaitingForWaveClearState');
const BossFightState = require('./states/BossFightState');
const PostBossDelayState = require('./states/PostBossDelayState');
const StageTransitionState = require('./states/StageTransitionState');

const ALL_STATES = [
    PreparationState,
    StageReadyState,
    WaveInProgressState,
    WaitingForWaveClearState,
    BossFightState,
    PostBossDelayState,
    StageTransitionState
];

/**
 * Регистрирует все игровые состояния в переданном StateManager.
 * @param {StateManager} stateManager - Экземпляр менеджера состояний для сессии.
 */
function registerAllStates(stateManager) {
    for (const StateClass of ALL_STATES) {
        stateManager.addState(new StateClass(stateManager));
    }
}

module.exports = {registerAllStates};
const BaseState = require('./BaseState');

class StageTransitionState extends BaseState {
    constructor(stateManager) {
        super('StageTransition', stateManager);
    }

    onEnter() {

        this.session.currentStageNumber = (this.session.currentStageNumber || 1) + 1;

        this.session.isLastStageWave = false;
        this.session.isBossWave = false;

        this.stateManager.transitionTo('WaveInProgress');
    }

}

module.exports = StageTransitionState;
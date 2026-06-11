const {ESK, BSK, PWRSK} = require('../core/gameStateKeys');

class DeltaCompressor {
    constructor() {
        this.cache = new Map();
    }

    addEntity(entityId, fullState) {

        this.cache.set(entityId, {...fullState});
    }

    removeEntity(entityId) {
        this.cache.delete(entityId);
    }

    compress(entityId, currentState) {
        const lastState = this.cache.get(entityId);

        if (!lastState) {
            this.addEntity(entityId, currentState);
            return currentState;
        }

        let delta = null;
        let hasChanges = false;

        if (currentState[ESK.HP] !== lastState[ESK.HP]) {
            if (!delta) delta = {};
            delta[ESK.HP] = currentState[ESK.HP];
            hasChanges = true;
        }

        if (currentState[ESK.POSITION][0] !== lastState[ESK.POSITION][0] || currentState[ESK.POSITION][1] !== lastState[ESK.POSITION][1]) {
            if (!delta) delta = {};
            delta[ESK.POSITION] = currentState[ESK.POSITION];
            hasChanges = true;
        }

        if (currentState[ESK.VELOCITY] && (
            !lastState[ESK.VELOCITY] ||
            currentState[ESK.VELOCITY][0] !== lastState[ESK.VELOCITY][0] ||
            currentState[ESK.VELOCITY][1] !== lastState[ESK.VELOCITY][1]
        )) {
            if (!delta) delta = {};
            delta[ESK.VELOCITY] = currentState[ESK.VELOCITY];
            hasChanges = true;
        }

        if (currentState[ESK.ROTATION] !== undefined && currentState[ESK.ROTATION] !== lastState[ESK.ROTATION]) {
            if (!delta) delta = {};
            delta[ESK.ROTATION] = currentState[ESK.ROTATION];
            hasChanges = true;
        }

        if (currentState[BSK.POSITION] && (
            !lastState[BSK.POSITION] ||
            currentState[BSK.POSITION][0] !== lastState[BSK.POSITION][0] ||
            currentState[BSK.POSITION][1] !== lastState[BSK.POSITION][1]
        )) {
            if (!delta) delta = {};
            delta[BSK.POSITION] = currentState[BSK.POSITION];
            hasChanges = true;
        }

        if (currentState[BSK.VELOCITY] && (
            !lastState[BSK.VELOCITY] ||
            currentState[BSK.VELOCITY][0] !== lastState[BSK.VELOCITY][0] ||
            currentState[BSK.VELOCITY][1] !== lastState[BSK.VELOCITY][1]
        )) {
            if (!delta) delta = {};
            delta[BSK.VELOCITY] = currentState[BSK.VELOCITY];
            hasChanges = true;
        }

        if (hasChanges) {
            Object.assign(lastState, delta);
        }

        return delta;
    }
}

module.exports = DeltaCompressor;
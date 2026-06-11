class StateManager {
    /**
     * @param {object} session - Игровая сессия, которой управляет этот менеджер.
     */
    constructor(session) {
        this.session = session;
        this.currentState = null;
        this.states = {};
    }

    /**
     * Добавляет новое состояние в менеджер.
     * @param {BaseState} state - Экземпляр состояния.
     */
    addState(state) {
        this.states[state.name] = state;
    }

    /**
     * Главный метод, вызываемый из игрового цикла.
     */
    update(delta) {
        if (this.currentState) {
            this.currentState.onUpdate(delta);
        }
    }

    /**
     * Метод для смены состояния.
     * @param {string} stateName - Имя нового состояния.
     * @param {object} [enterParams] - Опциональные параметры для метода onEnter нового состояния.
     */
    transitionTo(stateName, enterParams) {
        const newState = this.states[stateName];
        if (!newState) {

            return;
        }

        if (this.currentState) {

            this.currentState.onExit();
        }

        this.currentState = newState;

        this.currentState.onEnter(enterParams);
    }
}

module.exports = StateManager;
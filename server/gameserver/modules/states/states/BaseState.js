class BaseState {
    /**
     * @param {string} stateName Имя состояния для логирования.
     * @param {object} stateManager Менеджер состояний, который управляет этим состоянием.
     */
    constructor(stateName, stateManager) {
        this.name = stateName;
        this.stateManager = stateManager;
        this.session = stateManager.session;
    }

    /**
     * Вызывается один раз при входе в это состояние.
     * @param {object} [enterParams] - Опциональные параметры, которые можно передать при переходе.
     */
    onEnter(enterParams) {
    }

    /**
     * Вызывается на каждом тике игрового цикла.
     * @param {number} delta - Время, прошедшее с последнего кадра (в секундах).
     */
    onUpdate(delta) {
    }

    /**
     * Вызывается один раз при выходе из этого состояния.
     */
    onExit() {
    }
}

module.exports = BaseState;
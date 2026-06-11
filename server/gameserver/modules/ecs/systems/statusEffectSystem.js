const System = require('./System');
const logger = require("../../../core/logger");

class StatusEffectSystem extends System {
    constructor() {
        super();
        logger.info('[ECS:StatusEffectSystem] Initialized.');
    }

    /**
     * Проверяет, оглушена ли сущность.
     * @param {number} entityId - ID сущности.
     * @param {ComponentManager} cm - Менеджер компонентов сессии.
     * @param {number} now - Текущее время (Date.now()).
     * @returns {boolean}
     */
    checkStun(entityId, cm, now) {

        const statusEffects = cm.getComponent(entityId, 'statusEffects');

        if (!statusEffects) {
            return false;
        }

        return now < statusEffects.stunnedUntil;
    }

}

module.exports = new StatusEffectSystem();
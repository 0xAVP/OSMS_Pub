const logger = require('../../core/logger');

class InstantEffectSystem {
    /**
     * Применяет мгновенный эффект к сущности.
     * @param {number} entityId - ID сущности, к которой применяется эффект.
     * @param {object} effect - Объект эффекта из конфига паверапа.
     * @param {object} session - Игровая сессия.
     */
    apply(entityId, effect, session) {
        const cm = session.componentManager;

        switch (effect.target) {
            case 'hull': {
                const health = cm.getComponent(entityId, 'health');
                if (!health) return;

                let healAmount = 0;
                if (effect.valueType === 'percentage') {
                    healAmount = health.maxHull * effect.value;
                } else if (effect.valueType === 'flat') {
                    healAmount = effect.value;
                }

                health.hull = Math.min(health.maxHull, health.hull + healAmount);
                break;
            }

            default:
                logger.warn(`[InstantEffectSystem] Неизвестная цель для мгновенного эффекта: "${effect.target}"`);
                break;
        }
    }
}

module.exports = new InstantEffectSystem();

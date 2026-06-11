const logger = require('../../core/logger');
const {removeBuff} = require('./buffManager');

class BuffLifecycleSystem {
    constructor() {
        logger.info('[ECS:BuffLifecycleSystem] Initialized.');
    }

    /**
     * Проверяет все активные баффы на истечение срока действия.
     * @param {object} session - Игровая сессия.
     */
    update(session) {
        const cm = session.componentManager;
        const activeBuffsStore = cm.componentStores.get('active_buffs');
        if (!activeBuffsStore) return;

        const now = Date.now();

        for (const [entityId, buffsMap] of activeBuffsStore.entries()) {
            if (buffsMap.size === 0) continue;

            for (const [instanceId, buff] of buffsMap.entries()) {
                if (buff.expiresAt && now >= buff.expiresAt) {

                    removeBuff(entityId, instanceId, session);
                }
            }
        }
    }
}

module.exports = new BuffLifecycleSystem();
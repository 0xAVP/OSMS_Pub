function addBuff(entityId, effect, session) {
    const cm = session.componentManager;
    const activeBuffs = cm.getComponent(entityId, 'active_buffs');
    if (!activeBuffs) return;

    if (effect.stackable === false && effect.buffId) {
        let existingInstanceId = null;
        for (const [instanceId, activeBuff] of activeBuffs.entries()) {
            if (activeBuff.effect.buffId === effect.buffId) {
                existingInstanceId = instanceId;
                break;
            }
        }

        if (existingInstanceId) {

            const existingBuff = activeBuffs.get(existingInstanceId);
            existingBuff.expiresAt = effect.durationMs ? Date.now() + effect.durationMs : null;

            return;
        }
    }

    const buffInstance = session.componentPoolManager.acquire('buff_instance');
    buffInstance.expiresAt = effect.durationMs ? Date.now() + effect.durationMs : null;
    buffInstance.effect = effect;

    activeBuffs.set(`buff-inst-${Date.now()}-${Math.random()}`, buffInstance);

    cm.addComponent(entityId, 'stats_dirty', {});
}

/**
 * Удаляет бафф, возвращая его инстанс в пул и помечая статы как "грязные".
 * @param {number} entityId ID сущности.
 * @param {string} instanceId Уникальный ID экземпляра баффа.
 * @param {object} session Игровая сессия.
 */
function removeBuff(entityId, instanceId, session) {
    const cm = session.componentManager;
    const activeBuffs = cm.getComponent(entityId, 'active_buffs');
    if (!activeBuffs || !activeBuffs.has(instanceId)) return;

    const buffInstance = activeBuffs.get(instanceId);

    session.componentPoolManager.release('buff_instance', buffInstance);
    activeBuffs.delete(instanceId);

    cm.addComponent(entityId, 'stats_dirty', {});
}

module.exports = {addBuff, removeBuff};
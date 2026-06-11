const logger = require('../../../core/logger');
const {generateLoot} = require('../../entities/lootManager');
const {GET, EPK} = require('../../../core/gameStateKeys');

class LootDropSystem {
    constructor() {
        logger.info('[ECS:LootDropSystem] Initialized.');
    }

    /**
     * Сканирует сущности с 'loot_drop_request', генерирует для них лут
     * и либо создает событие, либо передает данные следующей системе.
     * @param {object} session - Игровая сессия.
     */
    process(session) {
        const cm = session.componentManager;
        const lootRequests = cm.componentStores.get('loot_drop_request');

        if (!lootRequests || lootRequests.size === 0) {
            return;
        }

        const requestsToProcess = Array.from(lootRequests.entries());

        for (const [entityId, request] of requestsToProcess) {

            const finalLoot = generateLoot(session, entityId, request.reason);

            if (request.reason === 'mined') {

                if (finalLoot && finalLoot.length > 0) {
                    session.gameEvents.push([
                        GET.RESOURCE_MINED,
                        {
                            [EPK.ENEMY_ID]: entityId,
                            [EPK.LOOT]: finalLoot
                        }
                    ]);
                }
            } else if (request.reason === 'killed') {
                const destructionInfo = cm.getComponent(entityId, 'pending_destruction');
                if (destructionInfo) {
                    destructionInfo.lootPayload = finalLoot;
                } else {

                    logger.error(`[LootDropSystem] CRITICAL: Loot generated for entity ${entityId} but it is not pending destruction. Loot will be lost!`);
                }
            }

            cm.removeComponent(entityId, 'loot_drop_request');
        }
    }
}

module.exports = new LootDropSystem();
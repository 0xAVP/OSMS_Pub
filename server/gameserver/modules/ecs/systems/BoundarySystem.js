const System = require('./System');
const logger = require('../../../core/logger');
const {terminateSession} = require('../../session/sessionTerminator');
const {GET, EPK} = require('../../../core/gameStateKeys');
const CONFIG = require('../../../core/config');

class BoundarySystem extends System {
    constructor() {
        super();
        logger.info('[ECS:BoundarySystem] Initialized.');
    }

    /**
     * Выполняет проверку границ для всех релевантных сущностей в сессии.
     * @param {object} session - Игровая сессия.
     */
    update(session) {
        const cm = session.componentManager;

        const posStore = cm.componentStores.get('position');
        const pendingDestructionStore = cm.componentStores.get('pending_destruction');

        if (!posStore) return;

        for (const [entityId, position] of posStore.entries()) {

            if (entityId === session.playerEntityId) continue;

            if (pendingDestructionStore && pendingDestructionStore.has(entityId)) {
                continue;
            }

            const isOutOfBounds = this._isPositionOutOfBounds(position, session);

            if (isOutOfBounds) {
                this._applyBoundaryRules(session, entityId, position);
            }
        }
    }

    /**
     * Проверяет, находится ли позиция за пределами игрового мира с учетом буферов.
     * @param {object} position - Компонент позиции { x, y }.
     * @param {object} session - Игровая сессия.
     * @returns {boolean}
     * @private
     */
    _isPositionOutOfBounds(position, session) {
        const buffer = CONFIG.game.worldBoundsBuffer;
        return position.x > session.width + buffer.right ||
            position.y < -buffer.top ||
            position.y > session.height + buffer.bottom ||
            position.x < -buffer.left;
    }

    _applyBoundaryRules(session, entityId, position) {
        const cm = session.componentManager;

        const enemyStore = cm.componentStores.get('enemy');
        const indestructibleStore = cm.componentStores.get('indestructible');
        const statsStore = cm.componentStores.get('stats');
        const minionStore = cm.componentStores.get('minion');

        if (position.x < 0 && enemyStore.has(entityId) && !indestructibleStore.has(entityId)) {

            const isMinion = minionStore && minionStore.has(entityId);

            if (!isMinion) {
                const stats = statsStore ? statsStore.get(entityId) : null;
                if (stats) {
                    session.playerBaseHp -= stats.collisionDamage;
                    const newBaseHp = Math.max(0, session.playerBaseHp);
                    session.gameEvents.push([
                        GET.BASE_DAMAGED,
                        {[EPK.ENEMY_ID]: entityId, [EPK.NEW_BASE_HP]: newBaseHp}
                    ]);
                    if (session.playerBaseHp <= 0) {
                        terminateSession(session, 'baseBroken');
                    }
                }
            }
        }

        cm.addComponent(entityId, 'pending_destruction', {reason: 'out_of_bounds'});
    }
}

module.exports = new BoundarySystem();
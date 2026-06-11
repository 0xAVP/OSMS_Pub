const CONFIG = require('../../core/config');
const logger = require('../../core/logger');

const COMPONENTS_TO_PREWARM = [
    'position', 'velocity', 'position_history', 'history_snapshot', 'stats',
    'render', 'weaponState', 'statusEffects', 'behavior', 'collision_geometry', 'projectile'
];

const CHUNK_SIZE = 20;

/**
 * Асинхронно и порционно "прогревает" пулы компонентов.
 * @param {object} session - Игровая сессия.
 * @returns {Promise<void>}
 */
function prewarmComponentPools(session) {
    const start = performance.now();
    const poolManager = session.componentPoolManager;
    const enemyPoolSize = CONFIG.performance.ENEMY_COMPONENT_POOL_SIZE;
    const bulletPoolSize = CONFIG.performance.ENEMY_BULLET_POOL_SIZE;

    return new Promise(resolve => {
        const getPoolSize = (componentName) => (componentName === 'projectile' ? bulletPoolSize : Math.max(enemyPoolSize, bulletPoolSize));

        let componentIndex = 0;

        function processNextComponent() {
            if (componentIndex >= COMPONENTS_TO_PREWARM.length) {
                const duration = performance.now() - start;
                logger.debug(`[Session: ${session.sessionId}] All component pools pre-warmed in ${duration.toFixed(2)}ms.`);
                resolve();
                return;
            }

            const componentName = COMPONENTS_TO_PREWARM[componentIndex];
            const totalSize = getPoolSize(componentName);
            let processedCount = 0;

            function processChunk() {
                const tempStorage = [];
                const limit = Math.min(processedCount + CHUNK_SIZE, totalSize);

                for (let i = processedCount; i < limit; i++) {
                    tempStorage.push(poolManager.acquire(componentName));
                }
                for (const item of tempStorage) {
                    poolManager.release(componentName, item);
                }

                processedCount = limit;

                if (processedCount < totalSize) {

                    setImmediate(processChunk);
                } else {

                    componentIndex++;
                    setImmediate(processNextComponent);
                }
            }

            processChunk();
        }

        processNextComponent();
    });
}

module.exports = {prewarmComponentPools};
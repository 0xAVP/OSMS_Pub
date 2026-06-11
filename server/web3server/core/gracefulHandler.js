const redis = require('./redisClient');
const {getDbStatus} = require('../modules/dbconnection');
const {getContracts, provider} = require('../contracts/contracts');
const logger = require('./logger');
const {clearSecretsCache} = require("./secrets");

let isShuttingDown = false;

/**
 * Выполняет процедуру грациозного завершения работы.
 * @param {string} signal - Имя сигнала, вызвавшего завершение.
 * @param {object} params - Объект с сервером и другими ресурсами для закрытия.
 * @param {object} params.httpServer - Экземпляр HTTP-сервера для закрытия.
 * @param {object} params.craftShipListener - Экземпляр слушателя событий блокчейна.
 */
async function shutdown(signal, {httpServer, craftShipListener}) {
    if (isShuttingDown) {
        logger.warn('Процесс завершения уже запущен, повторный сигнал игнорируется.');
        return;
    }
    isShuttingDown = true;
    logger.warn(`Получен сигнал ${signal}. Начинаю грациозное завершение web3server...`);

    if (httpServer) {
        httpServer.close(() => {
            logger.info('HTTP-сервер больше не принимает новые соединения.');
        });
    }

    if (craftShipListener) {
        logger.info('Остановка прослушивания событий блокчейна...');
        craftShipListener.stop();
    }

    try {
        const promises = [];

        if (redis.redisClient && redis.redisClient.isOpen) {
            logger.info('Закрытие соединения с Redis...');
            promises.push(redis.redisClient.quit());
        }

        const {dbWs} = getDbStatus();
        if (dbWs && dbWs.readyState === dbWs.OPEN) {
            logger.info('Закрытие соединения с dbserver...');
            dbWs.close(1000, 'Server is shutting down');
        }

        const {provider: contractProvider} = getContracts();
        if (contractProvider && contractProvider.websocket) {
            logger.info('Закрытие WebSocket-соединения с блокчейн-провайдером...');
            contractProvider.websocket.terminate();
        }

        await Promise.all(promises);
        logger.info('Все соединения успешно закрыты.');
        clearSecretsCache();
        logger.info('Грациозное завершение web3server успешно выполнено. Выход.');
        process.exit(0);

    } catch (error) {
        logger.error('Ошибка во время грациозного завершения web3server:', {error: error.message, stack: error.stack});
        process.exit(1);
    }
}

/**
 * Инициализирует обработчики системных сигналов.
 * @param {object} params - Объект с сервером и другими ресурсами.
 */
function initializeGracefulShutdown(params) {
    const signals = ['SIGINT', 'SIGTERM'];
    signals.forEach(signal => {
        process.on(signal, () => shutdown(signal, params));
    });
    logger.info('Обработчики грациозного завершения для web3server инициализированы.');
}

module.exports = {initializeGracefulShutdown};
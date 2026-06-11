const mongoose = require('mongoose');
const redis = require('../core/redisClient');
const logger = require('../core/logger');
const {clearSecretsCache} = require("../core/secrets");

let isShuttingDown = false;

/**
 * Выполняет процедуру грациозного завершения работы.
 * @param {string} signal - Имя сигнала, вызвавшего завершение.
 * @param {object} httpServer - Экземпляр HTTP-сервера для закрытия.
 */
async function shutdown(signal, httpServer) {
    if (isShuttingDown) {
        logger.warn('Процесс завершения уже запущен, повторный сигнал игнорируется.');
        return;
    }
    isShuttingDown = true;
    logger.warn(`Получен сигнал ${signal}. Начинаю грациозное завершение...`);

    if (httpServer) {
        httpServer.close(() => {
            logger.info('HTTP-сервер больше не принимает новые соединения.');
        });
    }

    try {

        logger.info('Закрытие соединения с Redis...');
        await Promise.all([
            redis.redisClient.quit(),
            redis.redisSubscriber.quit()
        ]);
        logger.info('Соединения с Redis успешно закрыты.');

        logger.info('Закрытие соединения с MongoDB...');
        await mongoose.disconnect();
        logger.info('Соединение с MongoDB успешно закрыто.');
        clearSecretsCache();
        logger.info('Грациозное завершение успешно выполнено. Выход.');
        process.exit(0);

    } catch (error) {
        logger.error('Ошибка во время грациозного завершения:', {error: error.message, stack: error.stack});
        process.exit(1);
    }
}

/**
 * Инициализирует обработчики системных сигналов для грациозного завершения.
 * @param {object} httpServer - Экземпляр HTTP-сервера, который нужно будет закрыть.
 */
function initializeGracefulShutdown(httpServer) {
    const signals = ['SIGINT', 'SIGTERM'];
    signals.forEach(signal => {
        process.on(signal, () => shutdown(signal, httpServer));
    });
    logger.info('Обработчики грациозного завершения инициализированы.');
}

module.exports = {initializeGracefulShutdown};
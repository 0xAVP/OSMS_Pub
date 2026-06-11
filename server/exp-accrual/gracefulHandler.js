const mongoose = require('mongoose');
const schedule = require('node-schedule');
const logger = require('./logger');
const {clearSecretsCache} = require("./secrets");

let isShuttingDown = false;

/**
 * Выполняет процедуру грациозного завершения работы.
 * @param {string} signal - Имя сигнала, вызвавшего завершение.
 * @param {object} redisClient - Клиент Redis для закрытия.
 */
async function shutdown(signal, redisClient) {
    if (isShuttingDown) {
        logger.warn('Процесс завершения уже запущен, повторный сигнал игнорируется.');
        return;
    }
    isShuttingDown = true;
    logger.warn(`Получен сигнал ${signal}. Начинаю грациозное завершение воркера...`);

    logger.info('Отмена всех запланированных задач...');
    schedule.gracefulShutdown()
        .then(() => logger.info('Планировщик успешно остановлен.'))
        .catch(err => logger.error('Ошибка при остановке планировщика:', {error: err.message}));

    logger.info('Ожидание завершения текущей активной задачи (если она запущена)...');

    try {
        await schedule.gracefulShutdown();
        logger.info('Активных задач для ожидания не было или они успешно завершились.');

        if (redisClient && redisClient.isOpen) {
            logger.info('Закрытие соединения с Redis...');
            await redisClient.quit();
            logger.info('Соединение с Redis успешно закрыто.');
        }

        logger.info('Закрытие соединения с MongoDB...');
        await mongoose.disconnect();
        logger.info('Соединение с MongoDB успешно закрыто.');
        clearSecretsCache();
        logger.info('Грациозное завершение воркера успешно выполнено. Выход.');
        process.exit(0);

    } catch (error) {
        logger.error('Ошибка во время грациозного завершения воркера:', {error: error.message, stack: error.stack});
        process.exit(1);
    }
}

/**
 * Инициализирует обработчики системных сигналов.
 * @param {object} redisClient - Клиент Redis, который нужно будет закрыть.
 */
function initializeGracefulShutdown(redisClient) {

    const signals = ['SIGINT', 'SIGTERM'];
    signals.forEach(signal => {
        process.on(signal, () => shutdown(signal, redisClient));
    });
    logger.info('Обработчики грациозного завершения для воркера инициализированы.');
}

module.exports = {initializeGracefulShutdown};
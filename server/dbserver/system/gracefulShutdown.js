const mongoose = require('mongoose');
const schedule = require('node-schedule');
const logger = require('../core/logger');
const {clearSecretsCache} = require("../core/secrets");
let isShuttingDown = false;

async function shutdown(signal, handles) {
    if (isShuttingDown) {
        logger.warn('Процесс завершения уже запущен, повторный сигнал игнорируется.');
        return;
    }
    isShuttingDown = true;
    logger.warn(`Получен сигнал ${signal}. Начинаю грациозное завершение dbserver...`);
    logger.info('Закрытие серверов (WebSocket и HTTP)...');
    const serverClosePromises = [];
    if (handles.wss) {
        serverClosePromises.push(new Promise(resolve => handles.wss.close(resolve)));
    }
    if (handles.httpServer) {
        serverClosePromises.push(new Promise(resolve => handles.httpServer.close(resolve)));
    }
    await Promise.all(serverClosePromises);
    logger.info('Все серверы больше не принимают новые соединения.');
    logger.info('Остановка запланированных задач (expNotifier)...');
    await schedule.gracefulShutdown();
    logger.info('Запланированные задачи остановлены.');

    try {
        logger.info('Закрытие соединений с Redis...');

        await Promise.all([
            handles.redisClient?.quit(),
            handles.redisSubscriber?.quit()
        ].filter(Boolean));
        logger.info('Соединения с Redis успешно закрыты.');

        logger.info('Закрытие соединения с MongoDB...');
        await mongoose.disconnect();
        logger.info('Соединение с MongoDB успешно закрыто.');
        clearSecretsCache();
        logger.info('Грациозное завершение успешно выполнено. Выход.');
        process.exit(0);

    } catch (error) {
        logger.error('Ошибка во время грациозного завершения:', error);
        process.exit(1);
    }
}

function initializeGracefulShutdown(handles) {
    const signals = ['SIGINT', 'SIGTERM'];
    signals.forEach(signal => {
        process.on(signal, () => shutdown(signal, handles));
    });
    logger.info('Обработчики грациозного завершения инициализированы.');
}

module.exports = {initializeGracefulShutdown};

const logger = require('../core/logger');
const {gameSessions} = require('../modules/session/sessions');
const {terminateSession} = require('../modules/session/sessionTerminator');
const GameLoopManager = require('../modules/gameLoopManager');
const {clearSecretsCache} = require('../core/secrets');

let isShuttingDown = false;

/**
 * Выполняет процедуру грациозного завершения работы для воркер-процесса.
 * @param {string} signal - Имя сигнала, вызвавшего завершение.
 * @param {object} resources - Объект с ресурсами, которые нужно закрыть (wss, redisClient и т.д.).
 */
async function shutdownWorker(signal, resources) {
    if (isShuttingDown) {
        logger.warn(`[GracefulShutdown] Процесс завершения уже запущен, повторный сигнал ${signal} игнорируется.`);
        return;
    }
    isShuttingDown = true;
    logger.warn(`[GracefulShutdown] Worker ${process.pid} получил команду на завершение (${signal}). Начинаю грациозное завершение...`);

    logger.info('[GracefulShutdown] Остановка игрового цикла...');
    GameLoopManager.stop();

    if (resources.wss) {
        resources.wss.close(() => {
            logger.info('[GracefulShutdown] WebSocket-сервер больше не принимает новые соединения.');
        });
    }

    const terminationPromises = [];
    if (gameSessions.size > 0) {
        logger.info(`[GracefulShutdown] Завершение ${gameSessions.size} активных сессий...`);
        gameSessions.forEach(session => {

            terminationPromises.push(terminateSession(session, 'server_shutdown'));
        });

        await Promise.race([
            Promise.all(terminationPromises),
            new Promise(resolve => setTimeout(resolve, 2000))
        ]);
        logger.info('[GracefulShutdown] Все активные сессии завершены.');
    }

    try {
        logger.info('[GracefulShutdown] Закрытие внешних соединений...');
        if (resources.redisClient && resources.redisClient.isOpen) {
            await resources.redisClient.quit();
            logger.info('[GracefulShutdown] Соединение с Redis (клиент) успешно закрыто.');
        }
        if (resources.redisSubscriber && resources.redisSubscriber.isOpen) {
            await resources.redisSubscriber.quit();
            logger.info('[GracefulShutdown] Соединение с Redis (подписчик) успешно закрыто.');
        }
        if (resources.dbWs && resources.dbWs.readyState === 1) {
            resources.dbWs.close();
            logger.info('[GracefulShutdown] Соединение с DB Server WebSocket успешно закрыто.');
        }

        clearSecretsCache();

        logger.info(`[GracefulShutdown] Воркер ${process.pid} успешно завершил очистку. Выход.`);
        process.exit(0);

    } catch (error) {
        logger.error('[GracefulShutdown] Ошибка во время очистки ресурсов:', {
            error: error.message,
            stack: error.stack
        });
        process.exit(1);
    }
}

/**
 * Инициализирует обработчики системных сигналов для грациозного завершения воркера.
 * @param {object} resources - Объект с ресурсами, которые нужно будет закрыть.
 */
function initializeGracefulShutdown(resources) {

    process.on('message', (msg) => {
        if (msg === 'shutdown') {
            shutdownWorker('master_request', resources);
        }
    });

    logger.info(`[GracefulShutdown] Обработчики для воркера ${process.pid} инициализированы и ожидают команды от мастера.`);
}

module.exports = {initializeGracefulShutdown};

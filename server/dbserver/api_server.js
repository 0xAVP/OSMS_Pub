const path = require('path');
require('dotenv').config({path: path.resolve(__dirname, '.env')});
const mongoose = require('mongoose');
const CONFIG = require('./core/config');
const logger = require('./core/logger');
const {initializeSecrets, getSecret, decryptSecret} = require('./core/secrets');
const {loadCatalog} = require('./catalog/catalog');
const redis = require('./core/redisClient');
const redisSub = require('./core/redisSubscriber');
const seasonService = require('./services/seasonService');
const {initializeGracefulShutdown} = require('./system/gracefulShutdown');
const healthMonitor = require('./core/healthMonitor');

async function main() {
    logger.info('[API Server] Запуск процесса...');

    try {
        await initializeSecrets();

        const encryptedMongoCred = getSecret(CONFIG.security.infisical.secrets.ENCRYPTED_DB_CRED);
        if (!encryptedMongoCred) {
            throw new Error(`Учетные данные для БД (${CONFIG.security.infisical.secrets.ENCRYPTED_DB_CRED}) не найдены.`);
        }
        let mongoCred = await decryptSecret(encryptedMongoCred);

        const connectionString = CONFIG.database.MONGO_URI_START + mongoCred + CONFIG.database.MONGO_URI_END;
        mongoCred = null;

        await mongoose.connect(connectionString);
        logger.info('[API Server] Успешное подключение к MongoDB.');

        seasonService.initialize();
        await redis.connectRedis()
        await redisSub.connectAndSubscribe();
        loadCatalog();

        const leaderboardManager = require('./modules/leaderboard/leaderboardManager');
        const activeSeason = seasonService.getActiveSeason();
        await leaderboardManager.hydrateLeaderboardFromDB(activeSeason ? activeSeason.seasonNumber : null);

        const httpServer = require('./catalogHttpApi').startCatalogApiServer();
        const {wss} = require('./modules/handler.js');

        healthMonitor.start('api', 'main', true);
        require('./modules/expNotifier').startExpNotifier();
        logger.info(`[API Server] Сервер запущен и готов к приему WebSocket соединений на PID: ${process.pid}.`);

        initializeGracefulShutdown({
            wss,
            httpServer,
            redisClient: redis.redisClient,
            redisSubscriber: redisSub.redisSubscriber
        });

    } catch (error) {
        logger.error(`[API Server] КРИТИЧЕСКАЯ ОШИБКА при запуске: ${error.message}`, error.stack);
        process.exit(1);
    }
}

main();
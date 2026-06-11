require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');
const morgan = require('morgan');
const {validateTokenId} = require('./middleware/validators');
const logger = require('./core/logger');
const CONFIG = require('./core/config');
const {checkHealth} = require('./modules/healthCheck');
const {connectRedis} = require('./core/redisClient');
const {createMetadataGenerator} = require('./modules/metadataGenerator');
const {createMetadataHandler} = require('./modules/metadataHandler');
const {initializeGracefulShutdown} = require('./system/gracefulHandler');
const {initializeSecrets, getSecret, decryptSecret} = require('./core/secrets');
const echoesData = require('./data/echoesData.json');
logger.info(`[MetadataServer] Загружены данные для ${Object.keys(echoesData).length} Echo.`);

async function fetchCatalogs() {

    const modulesUrl = CONFIG.connections.CATALOG_MODULES_API_URL;
    const bonusesUrl = CONFIG.connections.CATALOG_BONUSES_API_URL;

    logger.info(`[MetadataServer] Пытаюсь получить каталоги с ${modulesUrl} и ${bonusesUrl}`);

    while (true) {
        try {

            const [modulesResponse, bonusesResponse] = await Promise.all([
                axios.get(modulesUrl, {timeout: 5000}),
                axios.get(bonusesUrl, {timeout: 5000})
            ]);

            if (modulesResponse.status === 200 && modulesResponse.data.success &&
                bonusesResponse.status === 200 && bonusesResponse.data.success) {

                logger.info('[MetadataServer] Все каталоги успешно получены.');

                return {
                    ...modulesResponse.data.data,
                    ...bonusesResponse.data.data
                };
            }
        } catch (error) {
            logger.error(`[MetadataServer] Не удалось получить каталоги: ${error.message}. Повторная попытка через ${CONFIG.logic.CATALOG_FETCH_RETRY_DELAY_MS} мс...`);
        }
        await new Promise(resolve => setTimeout(resolve, CONFIG.logic.CATALOG_FETCH_RETRY_DELAY_MS));
    }
}

async function main() {
    logger.info('[MetadataServer] Запуск...');

    try {
        await initializeSecrets();
        await connectRedis();
        const catalogPromise = fetchCatalogs();

        const secretName = CONFIG.security.infisical.secrets.ENCRYPTED_DB_CRED;
        const encryptedMongoCred = getSecret(secretName);
        if (!encryptedMongoCred) {
            throw new Error(`Учетные данные для БД ('${secretName}') не найдены в Infisical.`);
        }

        let mongoCred = await decryptSecret(encryptedMongoCred);

        const connectionString = CONFIG.database.MONGO_URI_START + mongoCred + CONFIG.database.MONGO_URI_END;
        await mongoose.connect(connectionString);
        mongoCred = null;
        logger.info('[MetadataServer] Успешное подключение к MongoDB.');

        const catalogs = await catalogPromise;

        const generateMetadata = createMetadataGenerator(catalogs);

        const metadataHandler = createMetadataHandler(generateMetadata);

        const app = express();
        app.set('trust proxy', 'loopback');
        app.use(cors());

        app.get('/health', async (req, res) => {
            const healthStatus = await checkHealth();
            if (healthStatus.ok) {
                return res.status(200).json(healthStatus);
            }

            return res.status(503).json(healthStatus);
        });

        app.use(morgan(
            ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] - :response-time ms',
            {stream: logger.stream}
        ));

        const apiRateLimiter = require('./middleware/rateLimiter');
        app.use(apiRateLimiter);

        app.get('/ship/:tokenId', validateTokenId, metadataHandler);

        app.get('/echo/:tokenId', validateTokenId, (req, res) => {
            const {tokenId} = req.params;

            const pilot = echoesData[tokenId];

            if (!pilot) {
                logger.warn(`[Handler-Pilot] Запрошен несуществующий пилот с tokenId: ${tokenId}`);
                return res.status(404).json({error: 'Pilot NFT not found'});
            }

            logger.info(`[Handler-Pilot] Отправлены метаданные для пилота #${tokenId}`);
            res.status(200).json(pilot);
        });

        app.use((err, req, res, next) => {

            if (err.status === 400 && err instanceof URIError) {
                logger.warn(`[ErrorHandler] Отклонен некорректный URL от IP ${req.ip}: ${err.message}`);
                return res.status(400).json({error: 'Malformed URI'});
            }

            logger.error(`[ErrorHandler] Непредвиденная ошибка: ${err.message}`, {stack: err.stack});

            res.status(500).json({error: 'Internal Server Error'});
        });

        const httpServer = app.listen(CONFIG.server.PORT, () => {
            logger.info(`[MetadataServer] Инициализация завершена. HTTP-сервер слушает порт ${CONFIG.server.PORT}`);
        });
        initializeGracefulShutdown(httpServer);

    } catch (error) {
        console.log(`[MetadataServer] FATAL: Не удалось запустить сервис: ${error.message}`);
        process.exit(1);
    }
}

main();


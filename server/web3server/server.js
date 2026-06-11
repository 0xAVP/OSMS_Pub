require('./core/loadEnv');
const CONFIG = require('./core/config');
const express = require('express');
const endpoints = require('./modules/endpoints');
const {startPilotOwnersUpdate} = require('./modules/pilotsOwnersTracker');
const {connectToDbServer, getDbStatus} = require('./modules/dbconnection');
const {connectionEmitter, isProviderConnected, initializeContracts} = require('./contracts/contracts');
const logger = require('./core/logger');
const morgan = require('morgan');
const {checkHealth} = require('./modules/healthCheck')
const {initializeGracefulShutdown} = require('./core/gracefulHandler');
const {BlockchainListener} = require("./modules/blockchainListener");
const {initializeSecrets} = require("./core/secrets");
const {connectRedis} = require('./core/redisClient');

const app = express();

app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);
app.use(morgan(
    ':remote-addr - :remote-user ":method :url HTTP/:http-version" :status :res[content-length] - :response-time ms',
    {stream: logger.stream}
));

app.use(express.json({limit: CONFIG.server.BODY_LIMIT}));

async function waitForDbConnection() {
    while (true) {
        const {dbConnected, identified} = getDbStatus();
        if (dbConnected && identified) return;
        await new Promise(resolve => setTimeout(resolve, CONFIG.connections.DB_CONNECTION_POLL_INTERVAL_MS));
    }
}

async function startServer() {
    await initializeSecrets();
    await connectToDbServer();
    await connectRedis();
    await waitForDbConnection();
    await initializeContracts();

    logger.debug('Web3Server: Waiting for blockchain provider connection...');
    if (!isProviderConnected()) {
        await new Promise(resolve => connectionEmitter.once('reconnected', resolve));
    }
    logger.info('Web3Server: Blockchain provider connected.');

    const craftShipListener = new BlockchainListener(getDbStatus);

    const setupBlockchainListeners = () => {
        logger.debug("Web3Server: Setting up/refreshing blockchain listeners...");
        craftShipListener.start();
    };
    setupBlockchainListeners();
    connectionEmitter.on('reconnected', setupBlockchainListeners);

    startPilotOwnersUpdate();

    app.get('/health', async (req, res) => {
        const healthStatus = await checkHealth();
        if (healthStatus.ok) {
            return res.status(200).json(healthStatus);
        }
        return res.status(503).json(healthStatus);
    });

    endpoints(app, getDbStatus);

    const httpServer = app.listen(CONFIG.server.PORT, () => {
        logger.info(`Web3Server запущен на порту ${CONFIG.server.PORT}`);
    });

    initializeGracefulShutdown({httpServer, craftShipListener});
}

startServer().catch(error => {

    logger.error('Web3Server: Fatal error during server startup:', {
        message: error.message,
        error: error,
        stack: error.stack
    });
    process.exit(1);
});

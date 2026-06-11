const CONFIG = require('../../core/config');
const logger = require('../../core/logger');
const {getSecret} = require('../../core/secrets');
const WebSocket = require('ws');
const {setWeaponMechanics} = require('../../core/weaponMechanicsStore');
const {encode, decode} = require('@msgpack/msgpack');

let dbWs;
let dbConnected = false;
let identified = false;
let activeSeasonInfo = null;

const KEEP_ALIVE_INTERVAL_MS = 30000;
let pingInterval;

const pendingRequests = new Map();

function dbSafeSend(type, requestId, payload) {
    if (dbWs && dbWs.readyState === WebSocket.OPEN) {
        dbWs.send(encode({type, requestId, payload}));
    } else {
        logger.warn(`[DBMANAGER] Cannot send '${type}' message via dbSafeSend: WebSocket is not open.`);
    }
}

function getActiveSeasonInfo() {
    return activeSeasonInfo;
}

const generateRequestId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

function connectToDbServer() {
    dbWs = new WebSocket(CONFIG.connections.dbServer.URL);

    dbWs.on('open', () => {

        logger.info(`[DBMANAGER] Worker ${process.pid}: Connected to dbServer`);
        dbConnected = true;
        startPing();

        const requestId = generateRequestId();

        try {

            const baseClientId = getSecret(CONFIG.security.infisical.secrets.GS_CLIENT_ID);

            if (!baseClientId) {

                throw new Error(`Secret '${CONFIG.security.infisical.secrets.GS_CLIENT_ID}' not found in Infisical cache.`);
            }

            const uniqueWorkerId = `${baseClientId}_worker_${process.pid}`;
            logger.info(`[DBMANAGER] Worker ${process.pid}: Identifying with unique ID: ${uniqueWorkerId}`);

            dbSafeSend('identify', requestId, {
                clientType: 'gameserver',
                clientId: uniqueWorkerId,
                sessionToken: null
            });

        } catch (err) {
            logger.error(`[DBMANAGER] Worker ${process.pid}: Failed to send identify message:`, err.message);
            dbWs.close();
        }
    });

    dbWs.on('pong', () => {

    });

    dbWs.on('message', (message) => {
        let data;
        try {
            data = decode(message);
        } catch (error) {
            logger.error(`[DBMANAGER] Worker ${process.pid}: Failed to parse dbServer message:`, error, 'Raw (hex):', message.toString('hex'));
            return;
        }

        const {type, requestId, payload} = data;

        if (type === 'identified') {
            logger.info(`[DBMANAGER] Worker ${process.pid}: Successfully identified with dbServer as ${payload.clientId}`);
            identified = true;

            if (payload.weaponMechanics && Object.keys(payload.weaponMechanics).length > 0) {

                setWeaponMechanics(payload.weaponMechanics);
            } else {
                logger.error(`[DBMANAGER] FATAL: Identified successfully, but NO weapon mechanics received. Worker ${process.pid} cannot function properly.`);
                logger.error(`[DBMANAGER] Initiating immediate shutdown to force restart...`);

                process.exit(1);
            }

            if (payload.activeSeasonInfo) {
                activeSeasonInfo = payload.activeSeasonInfo;
                logger.debug(`[DBMANAGER] Active season received: №${activeSeasonInfo.seasonNumber}, ends at ${activeSeasonInfo.endDate}`);
            } else {
                activeSeasonInfo = null;
                logger.debug(`[DBMANAGER] No active season running (inter-season period).`);
            }
            return;
        }

        if (pendingRequests.has(requestId)) {
            const {resolve, reject, timeout} = pendingRequests.get(requestId);
            clearTimeout(timeout);
            pendingRequests.delete(requestId);

            if (type === 'error') {
                reject(new Error(payload));
            } else {
                resolve(data);
            }
        }
    });

    dbWs.on('error', (error) => {
        stopPing();
        logger.error(`[DBMANAGER] Worker ${process.pid}: Error connecting to dbServer:`, error.code || error);
        dbConnected = false;
        identified = false;
        pendingRequests.forEach(({reject, timeout}) => {
            clearTimeout(timeout);
            reject(new Error('WebSocket connection error'));
        });
        pendingRequests.clear();
    });

    dbWs.on('close', () => {
        stopPing();
        logger.warn(`[DBMANAGER] Worker ${process.pid}: Disconnected from dbServer`);
        dbConnected = false;
        identified = false;
        pendingRequests.forEach(({reject, timeout}) => {
            clearTimeout(timeout);
            reject(new Error('WebSocket connection closed'));
        });
        pendingRequests.clear();
        setTimeout(connectToDbServer, CONFIG.connections.dbServer.RECONNECT_TIMEOUT_MS);
    });
}

async function sendToDbServer(message) {
    if (!dbConnected || dbWs.readyState !== WebSocket.OPEN || !identified) {
        throw new Error('Database server unavailable or not identified');
    }

    const requestId = generateRequestId();
    message.requestId = requestId;

    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            if (pendingRequests.has(requestId)) {
                pendingRequests.delete(requestId);
                reject(new Error('Timeout waiting for dbServer response'));
            }
        }, CONFIG.connections.dbServer.RESPONSE_TIMEOUT_MS);

        pendingRequests.set(requestId, {resolve, reject, timeout});
        dbWs.send(encode(message));
    });
}

/**
 * Запрашивает у DBServer'а данные лидерборда: топ игроков и ранг конкретного игрока.
 * @param {string} walletAddress - Адрес кошелька игрока, чей ранг нужно найти.
 * @returns {Promise<object|null>} Объект с данными лидерборда или null в случае ошибки.
 */
async function fetchLeaderboardData(walletAddress) {
    const activeSeason = getActiveSeasonInfo();
    walletAddress = walletAddress?.toLowerCase();
    if (!activeSeason) {
        logger.debug(`[DBMANAGER] Запрос данных лидерборда для ${walletAddress} пропущен: нет активного сезона.`);
        return null;
    }

    try {
        const message = {
            type: 'get-leaderboard',
            payload: {
                walletAddress: walletAddress,
                seasonNumber: activeSeason.seasonNumber,
                count: 9,
                offset: 0
            }
        };

        const response = await sendToDbServer(message);

        if (response?.payload?.success) {

            return {status: 'success', data: response.payload.data};
        } else {
            const errorReason = response?.payload?.error || 'Unknown error from DBServer';
            logger.error(`[DBMANAGER] Не удалось получить данные лидерборда для ${walletAddress}: ${errorReason}`);

            return {status: 'error', data: null, message: errorReason};
        }
    } catch (error) {

        logger.error(`[DBMANAGER] Ошибка при отправке запроса get-leaderboard: ${error.message}`);
        return {status: 'error', data: null, message: error.message};
    }
}

function startPing() {
    stopPing();

    pingInterval = setInterval(() => {
        if (dbWs && dbWs.readyState === WebSocket.OPEN) {

            dbWs.ping();

        }
    }, KEEP_ALIVE_INTERVAL_MS);
}

function stopPing() {
    if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
    }
}

module.exports = {
    connectToDbServer,
    sendToDbServer,
    getActiveSeasonInfo,
    isDbConnected: () => dbConnected,
    isDbIdentified: () => identified,
    fetchLeaderboardData,
    get dbWsClient() {
        return dbWs;
    }
};
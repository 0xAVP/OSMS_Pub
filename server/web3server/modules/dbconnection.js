const WebSocket = require('ws');
const {safeSend, generateRequestId} = require('../core/utils');
const CONFIG = require('../core/config');
const logger = require('../core/logger');
const {handleDbMessage} = require('./messageHandler');
const {getSecret} = require("../core/secrets");

let dbWs;
let dbConnected = false;
let identified = false;
const pendingRequests = new Map();

const KEEP_ALIVE_INTERVAL_MS = 30000;
let pingInterval;

function connectToDbServer() {

    return new Promise((resolve, reject) => {
        if (pingInterval) clearInterval(pingInterval);

        dbWs = new WebSocket(CONFIG.connections.DB_SERVER_URL);

        const handleReconnect = () => {

            if (pingInterval) clearInterval(pingInterval);

            setTimeout(() => connectToDbServer().catch(() => {
            }), CONFIG.connections.DB_SERVER_REC_TIMEOUT_MS);
        };

        dbWs.on('open', () => {
            logger.info('Web3Server: Connected to dbServer');
            dbConnected = true;

            pingInterval = setInterval(() => {
                if (dbWs.readyState === WebSocket.OPEN) {

                    dbWs.ping();
                }
            }, KEEP_ALIVE_INTERVAL_MS);

            const requestId = generateRequestId();

            try {

                const clientId = getSecret(CONFIG.security.infisical.secrets.WEB3_CLIENT_ID);
                if (!clientId) {
                    throw new Error(`Secret for WEB3_CLIENT_ID not found.`);
                }

                safeSend(dbWs, 'identify', requestId, {
                    clientType: 'web3server',
                    clientId: clientId,
                    sessionToken: null
                });

                resolve();

            } catch (err) {
                logger.error('Web3Server: Failed to send identify message:', err.message);
                dbWs.close();
                reject(err);
            }
        });

        dbWs.on('message', async (message) => {
            identified = (await handleDbMessage(message, dbWs, pendingRequests)) || identified;
        });

        dbWs.on('error', (error) => {
            logger.error('Web3Server: Error connecting to dbServer:', error.code || error);
            dbConnected = false;
            identified = false;

            if (dbWs.readyState !== WebSocket.OPEN) {
                reject(error);
            }

        });

        dbWs.on('close', () => {
            logger.error('Web3Server: Disconnected from dbServer');
            dbConnected = false;
            identified = false;

            if (pingInterval) clearInterval(pingInterval);
            handleReconnect();
        });

        dbWs.on('pong', () => {

        });
    });
}

const getDbStatus = () => ({dbConnected, dbWs, identified, pendingRequests});

module.exports = {connectToDbServer, getDbStatus};
const WebSocket = require('ws');
const {v4: uuidv4} = require('uuid');
const CONFIG = require('../core/config');
const logger = require('../core/logger');
const {handleSessionMessage, verifyConnectedClientSession} = require('./session/session');
const redis = require('../core/redisClient');
const {checkRateLimit, isIpWhitelisted} = require('../middleware/rateLimiter');
const {getWeaponMechanics,} = require('../catalog/catalog');
const seasonService = require('../services/seasonService')
const {handleGameServerMessage} = require('./gameServerHandler');
const {handleWeb3ServerMessage} = require("./web3ServerHandler");
const {handlePlayerClientMessage} = require("./playerClientHandler");
const {hashSessionToken, safeSend, getClientIp} = require('../core/utils');
const {decode} = require('@msgpack/msgpack');
const {getSecret} = require("../core/secrets");

const clients = new Map();
let web3serverWs = null;

const pendingShipRequests = new Map();

const wss = new WebSocket.Server({port: CONFIG.server.PORT});

function findExistingConnectionByWalletAddress(walletAddress) {

    const targetAddress = walletAddress.toLowerCase();
    for (const [ws, clientInfo] of clients) {

        if (clientInfo.clientType === 'client' && clientInfo.walletAddress && clientInfo.walletAddress.toLowerCase() === targetAddress) {
            return {ws, clientInfo};
        }
    }
    return null;
}

function addPendingShipRequest(clientWs, clientRequestId, walletAddress) {
    if (!web3serverWs || web3serverWs.readyState !== WebSocket.OPEN) {
        safeSend(clientWs, clientRequestId, 'get-ships-response', {success: false, error: 'Web3Server unavailable'});
        return;
    }

    const verifyRequestId = uuidv4();
    pendingShipRequests.set(verifyRequestId, {ws: clientWs, clientRequestId});
    safeSend(web3serverWs, verifyRequestId, 'fetch-ships-by-address', {walletAddress});

    setTimeout(() => {
        if (pendingShipRequests.has(verifyRequestId)) {
            const {ws, clientRequestId} = pendingShipRequests.get(verifyRequestId);
            pendingShipRequests.delete(verifyRequestId);
            safeSend(ws, clientRequestId, 'get-ships-response', {
                success: false,
                error: 'Timeout waiting for Web3Server'
            });
        }
    }, 30000);
}

wss.on('connection', (ws, req) => {
    const clientIp = getClientIp(req);

    if (!clientIp) {
        logger.error('[Handler] CRITICAL: Could not determine client IP address. Closing connection.');
        ws.terminate();
        return;
    }
    logger.info(`New client connected from IP: ${clientIp}`);

    const identifyTimeout = setTimeout(() => {
        if (!clients.has(ws)) {
            console.log('Client failed to identify, closing connection');
            safeSend(ws, null, 'error', {success: false, error: 'Identification timeout'});
            ws.close();
        }
    }, CONFIG.security.IDENTIFY_TIMEOUT_MS);

    ws.on('message', async (message) => {

        if (!(message instanceof Buffer)) {
            logger.warn('Received non-binary message, which is not expected. Closing connection.');
            ws.close(1003, "Unsupported data format");
            return;
        }

        if (message.length > CONFIG.security.MAX_MESSAGE_SIZE_BYTES) {
            logger.error('Message size exceeds limit. Closing connection:', message.length);
            ws.close();
            return;
        }

        let data;
        try {
            data = decode(message);
        } catch (err) {
            logger.warn('Failed to decode msgpack message:', err.message, 'Raw (hex):', message.toString('hex'));
            return;
        }

        const {type, payload, requestId} = data;
        if (!type || !requestId || typeof payload !== 'object') {
            logger.warn('Invalid message structure:', {type, requestId, payload});
            return;
        }

        if (type === 'identify') {
            const {clientType, clientId, sessionToken} = payload;
            const walletAddress = (payload.walletAddress && typeof payload.walletAddress === 'string')
                ? payload.walletAddress.toLowerCase()
                : null;

            console.log('!!! DEBUG SECURITY !!!');
            console.log(`DETECTED IP: '${clientIp}'`);
            console.log(`WHITELIST:`, CONFIG.security.SERVER_WHITELISTED_IPS);
            console.log(`Is Allowed? ${isIpWhitelisted(clientIp)}`);
            console.log('========================');

            if (!clientType) {
                console.log('Client type is missing');
                ws.close();
                return;
            }
            if (clientType === 'gameserver' || clientType === 'web3server') {
                if (!isIpWhitelisted(clientIp)) {
                    safeSend(ws, requestId, 'error', {success: false, error: 'Access is denied'});
                    ws.close();
                    return;
                }
            } else if (clientType === 'client') {

                const isAllowed = await checkRateLimit(clientIp, 'unknown');
                if (!isAllowed) {
                    safeSend(ws, requestId, 'error', {success: false, error: 'Too many requests'});
                    ws.close();
                    return;
                }
            }

            switch (clientType) {
                case 'client':
                    try {

                        if (!walletAddress || !/^0x[a-f0-9]{40}$/.test(walletAddress)) {
                            safeSend(ws, requestId, 'identified', {
                                success: false,
                                error: 'Invalid or missing walletAddress'
                            });
                            ws.close();
                            return;
                        }

                        if (!sessionToken || typeof sessionToken !== 'string' || sessionToken.length > 64) {
                            safeSend(ws, requestId, 'identified', {
                                success: false,
                                error: 'Invalid or missing sessionToken'
                            });
                            ws.close();
                            return;
                        }

                        const hasPilot = await redis.redisClient.sIsMember('pilot_owners_list', walletAddress);

                        if (!hasPilot) {
                            logger.warn(`[Identify] Вход в ангар заблокирован для ${walletAddress}: отсутствует Echo.`, `identify_${walletAddress}`);

                            safeSend(ws, requestId, 'identified', {success: false, error: 'NO_ECHO_ON_ACCOUNT'});

                            ws.close(1008, 'Echo required to enter hangar');
                            return;
                        }

                        const sessionResult = await verifyConnectedClientSession(hashSessionToken(sessionToken));
                        if (!sessionResult.success) {
                            console.error(`dbServer: Invalid session for wallet ${walletAddress}. Error: ${sessionResult.error}`);
                            safeSend(ws, requestId, 'identified', {
                                success: false,
                                error: sessionResult.error || 'Invalid session'
                            });
                            ws.close();
                            return;
                        }

                        const existingConnection = findExistingConnectionByWalletAddress(walletAddress);
                        if (existingConnection) {
                            safeSend(existingConnection.ws, null, 'error', {
                                success: false,
                                error: 'Connection replaced by new session'
                            });
                            existingConnection.ws.close(1008, 'Replaced by new connection');
                            clients.delete(existingConnection.ws);
                        }

                        const generatedClientId = `cl-${uuidv4()}`;
                        const sessionTokenHash = hashSessionToken(sessionToken);
                        clients.set(ws, {clientType, clientId: generatedClientId, walletAddress, sessionTokenHash});

                        safeSend(ws, requestId, 'identified', {
                            success: true,
                            clientId: generatedClientId,
                            serverTime: Date.now()
                        });
                        const playerSessions = Array.from(clients.values()).filter(client => client.clientType === 'client').length;
                        console.log(`Players in HANGAR: ${playerSessions}`);
                        await redis.redisClient.publish('session-events', JSON.stringify({
                            event: 'new_hangar_session',
                            walletAddress
                        }));

                    } catch (error) {

                        logger.warn(`[Identify Client] CRITICAL error for ${walletAddress || 'unknown'}: ${error.message}`);
                        safeSend(ws, requestId, 'error', {
                            success: false,
                            error: 'Internal server error during identification'
                        });
                        ws.close();
                        return;
                    }
                    break;

                case 'gameserver':
                    const gameserverClientIdSecret = getSecret(CONFIG.security.infisical.secrets.GS_CLIENT_ID);
                    if (!clientId || !clientId.startsWith(gameserverClientIdSecret)) {
                        ws.close();
                        return;
                    }
                    clients.set(ws, {clientType, clientId});
                    const activeSeason = seasonService.getActiveSeason();
                    safeSend(ws, requestId, 'identified', {
                        clientId: clientId,
                        weaponMechanics: getWeaponMechanics(),
                        activeSeasonInfo: activeSeason ? {
                            seasonNumber: activeSeason.seasonNumber,
                            endDate: activeSeason.endDate
                        } : null
                    });
                    break;

                case 'web3server':
                    const web3serverClientIdSecret = getSecret(CONFIG.security.infisical.secrets.WEB3_CLIENT_ID);
                    if (!clientId || clientId !== web3serverClientIdSecret) {
                        ws.close();
                        return;
                    }
                    if (web3serverWs) {
                        ws.close();
                        return;
                    }
                    clients.set(ws, {clientType, clientId});
                    web3serverWs = ws;
                    safeSend(ws, requestId, 'identified', {
                        clientId: clientId
                    });

                    break;

                default:
                    logger.warn(`[SECURITY] Connection attempt with unknown clientType: '${clientType}'. Closing connection.`);
                    ws.close();
                    return;
            }

            clearTimeout(identifyTimeout);
            logger.info(`Client identified and connection stored: ${clientType}, ID: ${clientId || clients.get(ws)?.clientId}`);
            return;
        }

        if (!clients.has(ws)) {
            logger.warn('Client not identified for message:', type);
            return;
        }

        const clientInfo = clients.get(ws);

        if (clientInfo.clientType === 'client') {
            let limitType = 'client';

            if (type === 'start-craft') {
                limitType = 'startCraft';
            } else if (type === 'upgrade-module' || type === 'upgrade-ship-module') {
                limitType = 'moduleUpgrade';
            }

            const isAllowed = await checkRateLimit(clientInfo.walletAddress, limitType);
            if (!isAllowed) {
                logger.warn(`Rate limit exceeded for ${clientInfo.walletAddress} (type: ${limitType})`);

                safeSend(ws, requestId, 'error', {success: false, error: 'Too many requests'});
                return;
            }

        }

        const sessionHandled = await handleSessionMessage(ws, type, payload, clientInfo, requestId);
        if (sessionHandled) {

            return;
        }

        switch (clientInfo.clientType) {
            case 'client':

                await handlePlayerClientMessage(
                    ws,
                    clientInfo,
                    type,
                    payload,
                    requestId,
                    findExistingConnectionByWalletAddress,
                    addPendingShipRequest
                );
                break;

            case 'gameserver':
                await handleGameServerMessage(ws, type, payload, requestId);
                break;

            case 'web3server':

                await handleWeb3ServerMessage(ws, type, payload, requestId, pendingShipRequests);
                break;

            default:
                logger.warn(`[CRITICAL] Unknown clientType in message handler: '${clientInfo.clientType}'. Closing connection.`);
                break;
        }

    });

    ws.on('close', () => {
        if (clients.has(ws)) {
            const clientInfo = clients.get(ws);
            logger.info(`Client disconnected: ${clientInfo.clientType}, ID: ${clientInfo.clientId}`);
            if (clientInfo.clientType === 'web3server') {
                web3serverWs = null;
            }

            for (const [verifyRequestId, request] of pendingShipRequests) {
                if (request.ws === ws) {
                    pendingShipRequests.delete(verifyRequestId);

                }
            }
            clients.delete(ws);
        } else {
            logger.debug('Unidentified client disconnected');
        }
    });

    ws.on('error', (error) => console.error('WebSocket error:', error.message));
});

module.exports = {wss, clients};
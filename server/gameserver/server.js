const cluster = require('cluster');
const path = require('path');
require('dotenv').config({path: path.resolve(__dirname, '.env')});
const {initializeMonitoring} = require('./monitoring');
const os = require('os');
const logger = require('./core/logger');
const {encode, decode} = require('@msgpack/msgpack');

const CONFIG = require('./core/config');
const WebSocket = require('ws');
const {
    createSessionShell,
    sessionInitializationGenerator,
    runSessionGenerator
} = require('./modules/session/sessionCreatorV2');
const {endSession, handleDisconnect, terminateSession} = require('./modules/session/sessionTerminator');
const {SESSION_STATES} = require('./modules/session/sessionStates');
const GameLoopManager = require('./modules/gameLoopManager');
const {connectToDbServer, dbWsClient} = require('./modules/db/dbManager');
const {gameSessions} = require('./modules/session/sessions');
const {
    startGameSchema, hitClaimSchema,
    playerActionsSchema,
    emptyPayloadSchema, reconnectRequestSchema
} = require('./core/validation');
const {connectAndSubscribeRedis, redisSubscriberClient} = require('./modules/db/redisSubscriber');
const redis = require('./modules/db/redisClient');
const {MK, MT, CAK, CMT} = require('./core/gameStateKeys');
const {safeSend} = require("./utils/networkUtils");
const {releaseLock, acquireLock} = require("./modules/session/sessionLockManager");
const {verifySession} = require("./modules/session/sessionVerifier");
const {initializeSecrets} = require("./core/secrets");
const {initializeGracefulShutdown} = require('./system/gracefulHandler');
const {resumeSession} = require('./modules/session/sessionResumer');

const numCPUs = os.cpus().length;
cluster.schedulingPolicy = cluster.SCHED_RR;

if (cluster.isMaster) {

    logger.info(`Master process ${process.pid} is running`);
    logger.debug(`Forking server for ${numCPUs} CPU cores...`);

    let isShuttingDown = false;

    for (let i = 0; i < 1; i++) {
        setTimeout(() => {
            logger.debug(`Forking worker #${i + 1}...`);
            cluster.fork();
        }, i * CONFIG.cluster.FORK_DELAY_MS);
    }

    cluster.on('exit', (worker, code, signal) => {
        if (isShuttingDown) {
            logger.warn(`Worker ${worker.process.pid} exited during shutdown process.`);
            return;
        }
        logger.error(`Worker ${worker.process.pid} died. Code: ${code}, Signal: ${signal}`);
        setTimeout(() => {
            logger.warn('Attempting to start a new worker...');
            try {
                cluster.fork();
            } catch (err) {

                logger.error(`CRITICAL: Failed to fork a new worker after a crash. Error: ${err.message}`, {
                    code: err.code,
                    syscall: err.syscall
                });
                logger.error('The server is now running in a degraded state with fewer workers. Manual intervention may be required.');
            }
        }, CONFIG.cluster.RESTART_DELAY_MS);
    });

    const shutdownMaster = (signal) => {
        if (isShuttingDown) return;
        isShuttingDown = true;
        logger.warn(`Master process received ${signal}. Instructing all workers to shut down gracefully.`);

        for (const id in cluster.workers) {
            cluster.workers[id].send('shutdown');
        }

        setTimeout(() => {
            logger.error('Graceful shutdown timeout expired. Forcing termination of remaining workers.');
            for (const id in cluster.workers) {
                cluster.workers[id].kill('SIGKILL');
            }
            process.exit(1);
        }, 5000);
    };

    process.on('SIGINT', () => shutdownMaster('SIGINT'));
    process.on('SIGTERM', () => shutdownMaster('SIGTERM'));

} else {
    async function startWorker() {
        try {

            await initializeSecrets();

            const wss = new WebSocket.Server({port: CONFIG.server.PORT});

            connectToDbServer();
            connectAndSubscribeRedis();
            await redis.connectRedis();
            initializeGracefulShutdown({
                wss,
                redisClient: redis.redisClient,
                redisSubscriber: redisSubscriberClient,
                dbWs: dbWsClient
            });

            setInterval(() => {
                const now = Date.now();
                gameSessions.forEach((session, sessionId) => {
                    if (session.status === SESSION_STATES.PAUSED_DISCONNECTED) return;

                    const isClosed = session.ws.readyState === WebSocket.CLOSED || session.ws.readyState === WebSocket.CLOSING;

                    const isTimedOut = (now - session.lastHeartbeatTime) > CONFIG.performance.HEARTBEAT_TIMEOUT_MS;

                    if (isClosed || isTimedOut) {
                        logger.warn(`Worker ${process.pid}: Session ${sessionId} looks dead (Closed: ${isClosed}, Timeout: ${isTimedOut}). Triggering Soft Disconnect.`);

                        handleDisconnect(session.ws);
                    }
                });

                if (gameSessions.size > 0) {
                    console.log(`Worker ${process.pid}: Active sessions in this process: ${gameSessions.size}`);
                }

            }, CONFIG.performance.HEARTBEAT_CHECK_INTERVAL_MS);

            wss.on('connection', (ws, req) => {
                const origin = req.headers.origin || '';
                const allowedOrigins = CONFIG.server.ORIGIN_CLIENT_URL
                    ? CONFIG.server.ORIGIN_CLIENT_URL.split(',').map(s => s.trim())
                    : [];
                if (!origin || !allowedOrigins.includes(origin)) {
                    logger.warn(`Worker ${process.pid}: Connection rejected: Invalid origin ${origin}`);
                    ws.close(1008, 'Connection refused: Invalid origin');
                    return;
                }

                console.log(`Worker ${process.pid}: New client connected from`, origin);

                ws.on('message', async (message) => {

                    if (!(message instanceof Buffer)) {
                        logger.warn(`Worker ${process.pid}: Received non-binary message, which is not expected. Closing connection.`);
                        ws.close(1003, "Unsupported data format");
                        return;
                    }

                    if (message.length > CONFIG.server.MAX_MESSAGE_SIZE_BYTES) {
                        logger.warn(`Worker ${process.pid}: Message size exceeds 2KB limit: ${message.length}`);
                        ws.close();
                        return;
                    }

                    let data;
                    try {
                        data = decode(message);
                    } catch (error) {
                        logger.error(`Worker ${process.pid}: Failed to decode MessagePack message:`, error);
                        return;
                    }

                    const sim = CONFIG.networkSimulation;
                    if (sim.enabled) {

                        if (Math.random() < sim.packetLossChance) {

                            return;
                        }

                        const jitter = (Math.random() * 2 - 1) * sim.jitterMs;
                        const totalInboundDelay = Math.max(0, sim.baseLatencyMs + jitter);

                        setTimeout(() => {

                            if (ws.readyState === WebSocket.OPEN) {
                                processMessage(ws, data);
                            }
                        }, totalInboundDelay);

                    } else {
                        if (ws.readyState === WebSocket.OPEN) {
                            processMessage(ws, data);
                        }
                    }

                });

                ws.on('close', () => {
                    logger.debug(`Worker ${process.pid}: Client disconnected, ws.sessionId:`, ws.sessionId);
                    handleDisconnect(ws, gameSessions);
                });

                ws.on('error', (error) => console.error(`Worker ${process.pid}: WebSocket server error:`, error));
            });

            async function processMessage(ws, data) {
                if (!Array.isArray(data) || data.length === 0) {
                    logger.error(`Worker ${process.pid}: Invalid message structure, expected an array.`);
                    ws.close();
                    return;
                }

                const type = data[MK.TYPE];
                const payload = data[MK.PAYLOAD];

                switch (type) {
                    case CMT.FORFEIT_REQUEST: {
                        const forfeitValidation = emptyPayloadSchema.safeParse(payload);
                        if (!forfeitValidation.success) {
                            logger.warn(`Worker ${process.pid}: Invalid payload for FORFEIT_REQUEST, expected empty.`, forfeitValidation.error.format());
                            return;
                        }

                        const session = gameSessions.get(ws.sessionId);

                        if (session && (session.status === SESSION_STATES.ACTIVE || session.status === SESSION_STATES.PREPARATION || session.status === SESSION_STATES.POST_BOSS_DELAY)) {
                            logger.info(`Player ${session.player} forfeited session ${session.sessionId}.`);

                            terminateSession(session, 'playerForfeit');
                        }
                        break;
                    }
                    case CMT.START_GAME_REQUEST:
                        const startGameResult = startGameSchema.safeParse(payload);
                        if (!startGameResult.success) {
                            logger.warn(`Worker ${process.pid}: Invalid start-game payload:`, startGameResult.error.format());
                            safeSend(ws, {[MK.TYPE]: MT.ERROR, [MK.PAYLOAD]: "Invalid start-game payload"});
                            ws.close();
                            return;
                        }
                        let {walletAddress} = startGameResult.data;
                        walletAddress = walletAddress.toLowerCase();
                        startGameResult.data.walletAddress = walletAddress;
                        const isLockAcquired = await acquireLock(walletAddress);

                        if (!isLockAcquired) {
                            logger.warn(`[Server] Создание сессии для ${walletAddress} отклонено; ресурс заблокирован.`);
                            safeSend(ws, {
                                [MK.TYPE]: MT.ERROR,
                                [MK.PAYLOAD]: 'Session creation already in progress. Please wait.'
                            });
                            ws.close();
                            return;
                        }

                        try {
                            const verificationResult = await verifySession(ws, walletAddress, startGameResult.data.sessionToken);

                            if (verificationResult.valid) {
                                const sessionShell = createSessionShell(ws, startGameResult.data);
                                const generator = sessionInitializationGenerator(sessionShell);

                                runSessionGenerator(generator);
                            } else {

                                if (verificationResult.retry) {

                                    logger.info(`[Server] Отправка команды на повторную попытку клиенту ${walletAddress}`);
                                    const messagePayload = {
                                        [MK.TYPE]: MT.ERROR,
                                        [MK.PAYLOAD]: {
                                            message: 'Terminating previous session. Please wait.',
                                            code: 'RETRY_LATER'
                                        }
                                    };

                                    if (ws.readyState === WebSocket.OPEN) {

                                        ws.send(encode(messagePayload), (err) => {
                                            if (err) {

                                                logger.error(`[Server] Failed to send RETRY_LATER message to ${walletAddress}:`, err);
                                            }

                                            ws.close();
                                        });
                                    } else {

                                        ws.close();
                                    }
                                } else {

                                    ws.close();
                                }
                            }

                        } finally {

                            await releaseLock(walletAddress);
                            logger.debug(`[Server] Блокировка для ${walletAddress} снята.`);
                        }
                        break;

                    case CMT.RECONNECT_REQUEST: {
                        const validation = reconnectRequestSchema.safeParse(payload);
                        if (!validation.success) {
                            safeSend(ws, {[MK.TYPE]: MT.ERROR, [MK.PAYLOAD]: 'Invalid reconnect params'});
                            return;
                        }
                        const {walletAddress: rWallet, reconnectToken} = validation.data;
                        const normWallet = rWallet.toLowerCase();

                        try {

                            const redisDataStr = await redis.redisClient.hGet('active_game_sessions', normWallet);
                            if (!redisDataStr) {
                                safeSend(ws, {[MK.TYPE]: MT.RECONNECT_FAILED, [MK.PAYLOAD]: 'SESSION_EXPIRED'});
                                return;
                            }
                            let redisData;
                            try {
                                redisData = JSON.parse(redisDataStr);
                            } catch (e) {
                                safeSend(ws, {[MK.TYPE]: MT.RECONNECT_FAILED, [MK.PAYLOAD]: 'SESSION_INVALID_FORMAT'});
                                return;
                            }

                            if (redisData.reconnectToken !== reconnectToken) {
                                safeSend(ws, {[MK.TYPE]: MT.RECONNECT_FAILED, [MK.PAYLOAD]: 'INVALID_TOKEN'});
                                return;
                            }

                            if (redisData.workerPid !== process.pid) {

                                safeSend(
                                    ws,
                                    {
                                        [MK.TYPE]: MT.RECONNECT_FAILED,
                                        [MK.PAYLOAD]: {reason: 'WRONG_WORKER', retry: true}
                                    },
                                    () => ws.close()
                                );
                                return;
                            }

                            const session = gameSessions.get(redisData.sessionId);
                            if (!session) {

                                await redis.redisClient.hDel('active_game_sessions', normWallet);
                                safeSend(ws, {[MK.TYPE]: MT.RECONNECT_FAILED, [MK.PAYLOAD]: 'SESSION_LOST'});
                                return;
                            }

                            const success = resumeSession(session, ws);
                            if (!success) safeSend(ws, {
                                [MK.TYPE]: MT.ERROR,
                                [MK.PAYLOAD]: 'Resume failed internal error'
                            });

                        } catch (err) {
                            logger.error(`Reconnect error: ${err.message}`);
                            safeSend(ws, {[MK.TYPE]: MT.ERROR, [MK.PAYLOAD]: 'Server error during reconnect'});
                        }
                        break;
                    }

                    case CMT.PLAYER_ACTIONS: {
                        const playerSession = gameSessions.get(ws.sessionId);
                        if (!playerSession || playerSession.status !== SESSION_STATES.ACTIVE) {
                            return;
                        }

                        const actionsResult = playerActionsSchema.safeParse(payload);
                        if (!actionsResult.success) {
                            logger.warn(`Worker ${process.pid}: Invalid player-actions payload:`, actionsResult.error.format());
                            return;
                        }

                        const validatedActions = actionsResult.data;
                        if (validatedActions.length === 0) {
                            return;
                        }

                        if (!playerSession.inputQueue) {
                            playerSession.inputQueue = [];
                        }

                        playerSession.inputQueue.push(...validatedActions);

                        break;
                    }

                    case CMT.HIT_CLAIM: {
                        const session = gameSessions.get(ws.sessionId);
                        if (!session || session.status !== SESSION_STATES.ACTIVE) {
                            return;
                        }

                        const validationResult = hitClaimSchema.safeParse(payload);
                        if (!validationResult.success) {
                            logger.warn(`Worker ${process.pid}: Invalid hit-claim payload:`, validationResult.error.format());
                            return;
                        }

                        if (session.hitClaimQueue) {
                            session.hitClaimQueue.push(validationResult.data);
                        }

                        break;
                    }

                    case CMT.REQUEST_WEAPON_SWITCH: {
                        const switchValidation = emptyPayloadSchema.safeParse(payload);
                        if (!switchValidation.success) {
                            logger.warn(`Worker ${process.pid}: Invalid payload for REQUEST_WEAPON_SWITCH, expected empty.`, switchValidation.error.format());
                            return;
                        }
                        const session = gameSessions.get(ws.sessionId);
                        if (!session || session.status !== SESSION_STATES.ACTIVE) {
                            return;
                        }

                        session.componentManager.addComponent(session.playerEntityId, 'weapon_switch_request', {});

                        break;
                    }

                    case CMT.END_GAME_REQUEST:
                        const endValidation = emptyPayloadSchema.safeParse(payload);
                        if (!endValidation.success) {
                            logger.warn(`Worker ${process.pid}: Invalid payload for END_GAME_REQUEST, expected empty.`, endValidation.error.format());
                            return;
                        }
                        const session = gameSessions.get(ws.sessionId);
                        logger.debug(`Worker ${process.pid}: Received end-game request for session ${ws.sessionId}`);
                        if (session && session.status === SESSION_STATES.POST_BOSS_DELAY) {
                            session.status = SESSION_STATES.EXITING;
                            logger.debug(`Worker ${process.pid}: Session ststus: Exiting ${ws.sessionId}`);
                            endSession(ws, 'playerWin');
                        } else {
                            logger.warn(`Worker ${process.pid}: Ignored end-game request: session ${ws.sessionId} is not in POST_BOSS_DELAY`);
                        }
                        break;

                    case CMT.PONG: {

                        const pongValidation = emptyPayloadSchema.safeParse(payload);
                        if (!pongValidation.success) {
                            logger.warn(`Worker ${process.pid}: Invalid payload for PONG, expected empty.`, pongValidation.error.format());
                            return;
                        }

                        const playerSession = gameSessions.get(ws.sessionId);
                        if (playerSession && playerSession.lastPingSent) {
                            playerSession.lastHeartbeatTime = Date.now();
                            playerSession.ping = Date.now() - playerSession.lastPingSent;
                        }
                        break;
                    }
                    case CMT.TIME_SYNC_REQUEST: {

                        const clientTimestamp = payload;

                        if (ws.readyState === WebSocket.OPEN) {
                            ws.send(encode({
                                [MK.TYPE]: MT.TIME_SYNC_RESPONSE,
                                [MK.PAYLOAD]: {
                                    c: clientTimestamp,
                                    s: Date.now()
                                }
                            }));
                        }
                        break;
                    }

                    default:
                        logger.warn(`Worker ${process.pid}: Unhandled message type: ${type}. Closing connection.`);
                        ws.close();
                        break;
                }
            }

            GameLoopManager.start();

            logger.info(`Worker ${process.pid} started. WebSocket server running on port ${CONFIG.server.PORT}`);
        } catch (error) {

            logger.error(`[FATAL] Worker ${process.pid} failed to start: ${error.message}`, {stack: error.stack});
            process.exit(1);
        }
    }

    startWorker();
}
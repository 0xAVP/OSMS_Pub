const CONFIG = require('../../core/config');
const redis = require('../db/redisClient');
const {safeSend} = require('../../utils/networkUtils');
const {MK, MT} = require('../../core/gameStateKeys');
const SpatialGrid = require('../grids/SpatialGrid');
const StaticSpawnGrid = require('../grids/StaticSpawnGrid');
const EntityManager = require('../ecs/entityManager');
const ComponentManager = require('../ecs/componentManager');
const ComponentPoolManager = require('../ecs/componentPoolManager');
const {prewarmComponentPools} = require('./prewarmComponentPools');
const {ALL_COMPONENTS} = require('../ecs/componentRegistry');
const {isDbIdentified, isDbConnected} = require('../db/dbManager');
const {verifyShip, verifyPilot} = require('./sessionVerifier');
const {fetchPlayerData} = require('../db/playerDataFetcher');
const {buildPlayerEntity} = require('../entities/playerEntityBuilder');
const {sendSessionStarted} = require('./sessionSender');
const {SESSION_STATES} = require('./sessionStates');
const {initializeLoot} = require('../../objects/loot/lootCollector');
const StateManager = require('../states/StateManager');
const {registerAllStates} = require('../states/stateRegistry');
const lootIdManager = require('../../objects/loot/lootIdManager');
const DeltaCompressor = require('../../modules/deltaCompressor');
const {prepareShipData} = require("./prepareShip");
const logger = require("../../core/logger");
const {terminateSession} = require("./sessionTerminator");
const {gameSessions} = require('./sessions');
const crypto = require('crypto');

const {MIN_WIDTH, MIN_HEIGHT, MAX_WIDTH, MAX_HEIGHT} = CONFIG.validation.world;
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Часть 1: Создает и регистрирует минимальную "оболочку" сессии.
 * Выполняется мгновенно.
 */
function createSessionShell(ws, payload) {
    const walletAddress = payload.walletAddress?.toLowerCase();
    const sessionId = `${walletAddress}-${Date.now()}`;
    const sessionShell = {
        sessionId,
        ws,
        player: walletAddress,
        status: SESSION_STATES.INITIALIZING,
        initialPayload: payload
    };
    gameSessions.set(sessionId, sessionShell);
    ws.sessionId = sessionId;
    logger.debug(`[SessionCreator] Создана оболочка сессии ${sessionId}. Запуск поэтапной инициализации.`);
    return sessionShell;
}

/**
 * Часть 2: Асинхронный генератор, выполняющий инициализацию по частям.
 */
async function* sessionInitializationGenerator(session) {
    try {
        const {ws, initialPayload} = session;
        let {sessionToken, walletAddress, map, shipTokenId, pilotId, startWidth, startHeight} = initialPayload;
        walletAddress = walletAddress?.toLowerCase();

        logger.debug(`[Сессия ${session.sessionId}] Этап 1: Валидация параметров и проверка данных...`);

        if (!sessionToken || !walletAddress || !Number.isInteger(map) || !Number.isInteger(startWidth) || !Number.isInteger(startHeight) || !Number.isInteger(shipTokenId) || !Number.isInteger(pilotId)) {
            throw new Error('Invalid or missing parameters');
        }
        if (startWidth < MIN_WIDTH || startHeight < MIN_HEIGHT) {
            throw new Error(`Minimum resolution required: ${MIN_WIDTH}x${MIN_HEIGHT}.`);
        }
        if (startWidth > MAX_WIDTH || startHeight > MAX_HEIGHT) {
            throw new Error(`Maximum resolution required: ${MAX_WIDTH}x${MAX_HEIGHT}.`);
        }
        if (!isDbConnected() || !isDbIdentified()) {
            throw new Error('Database server unavailable or not identified');
        }

        const pilotVerifyResult = await verifyPilot(pilotId, walletAddress, ws);
        if (!pilotVerifyResult || !pilotVerifyResult.valid) {
            throw new Error('Pilot verification failed');
        }

        const shipVerifyResult = await verifyShip(shipTokenId, walletAddress, ws);
        if (!shipVerifyResult || !shipVerifyResult.valid) {
            throw new Error('Ship verification failed');
        }

        const playerData = await fetchPlayerData(walletAddress, shipTokenId);
        if (!playerData.shipData || !playerData.baseData || !playerData.activeBuffs) {
            throw new Error('Invalid player data: missing ship, base, or buffs data');
        }
        yield;

        await delay(300);
        logger.debug(`[Сессия ${session.sessionId}] Этап 2: Подготовка данных и создание тяжелых объектов...`);

        const {
            preparedShip,
            speedScaleFactor,
            sizeScaleFactor,
            calculatedHitboxRadius
        } = prepareShipData(playerData.shipData, startWidth, startHeight);

        let startingStage;
        if (CONFIG.game.FORCE_DEFAULT_STAGE === true) {
            startingStage = CONFIG.game.STAGE_LEVEL;
        } else {
            startingStage = 1;
            const portalBuff = Object.values(playerData.activeBuffs).find(buff => buff.group === 'time_portal');
            if (portalBuff) {
                const tierMatch = portalBuff.buffId.match(/_tier_(\d+)/);
                if (tierMatch && tierMatch[1]) {
                    const tier = parseInt(tierMatch[1], 10);
                    startingStage = (tier - 1) * 5 + 5;
                    const messagePayload = JSON.stringify({
                        event: 'consume_portal_buff',
                        walletAddress: walletAddress,
                        buffId: portalBuff.buffId
                    });
                    redis.redisClient.publish('buff-events', messagePayload);
                }
            }
        }

        const staticSpawnZone = {
            xMin: startWidth * 0.5,
            xMax: startWidth * 0.90,
            yMin: startHeight * 0.10,
            yMax: startHeight * 0.90,
        };

        const staticCellSize = 100 * sizeScaleFactor;
        const staticSpawnGrid = new StaticSpawnGrid(staticSpawnZone, staticCellSize);
        const reconnectToken = crypto.randomUUID();

        Object.assign(session, {
            reconnectToken,
            playerEntityId: null,
            countdownAccumulator: 0,
            ping: 0,
            hitClaimQueue: [],
            lastHeartbeatTime: Date.now(),
            spatialGrid: new SpatialGrid(startWidth, startHeight, CONFIG.performance.GRID_CELL_SIZE),
            staticSpawnGrid: staticSpawnGrid,
            gridQueryCache: new Set(),
            map,
            currentStageNumber: startingStage,
            width: startWidth,
            height: startHeight,
            startWidth,
            startHeight,
            speedScaleFactor,
            sizeScaleFactor,
            playerBaseHp: 30000 || playerData.baseData,
            pilotBonuses: pilotVerifyResult.bonuses || {},
            startTime: Date.now(),
            lastUpdate: Date.now(),
            lastEnemySpawn: 0,
            lastFireTime: 0,
            countdown: {
                isPreparation: true,
                gameTime: Math.ceil(CONFIG.game.PREPARATION_COUNTDOWN_MS / 1000),
                startTime: null
            },
            lastProcessedActionId: -1,
            lastActionTime: Date.now(),
            lastSentPlayerState: {},
            killCount: 0,
            loot: initializeLoot(),
            activeEntities: {
                enemies: new Set(),
                enemyBullets: new Set(),
                powerUps: new Set(),
            },
            entitiesToDestroy: new Set(),
            replication: {
                knownEnemyIds: new Set(),
                knownBulletIds: new Set(),
                knownPowerUpIds: new Set(),
                destroyedPowerUpIds: [],
                destroyedBulletIds: [],
                destroyedEnemyIds: [],
                deltaCompressor: new DeltaCompressor(),
            },
            entityManager: new EntityManager(),
            componentManager: new ComponentManager(),
            componentPoolManager: new ComponentPoolManager(),
            collisionEvents: [],
            gameEvents: [],
        });

        await prewarmComponentPools(session);

        yield

        await delay(300);
        logger.debug(`[Сессия ${session.sessionId}] Этап 3: Регистрация компонентов и ECS...`);

        for (const componentName of ALL_COMPONENTS) {
            session.componentManager.registerComponent(componentName);
        }

        session.stateManager = new StateManager(session);
        registerAllStates(session.stateManager);

        session.playerEntityId = buildPlayerEntity(session, preparedShip, startHeight, calculatedHitboxRadius);
        session.lootDictionary = lootIdManager.getDictionary();
        yield;

        await delay(300);
        logger.debug(`[Сессия ${session.sessionId}] Этап 4: Регистрация в Redis и запуск...`);

        const redisSessionData = JSON.stringify({
            sessionId: session.sessionId,
            workerPid: process.pid,
            reconnectToken: session.reconnectToken,
            startTime: Date.now()
        });

        await redis.redisClient.hSet('active_game_sessions', walletAddress, redisSessionData);
        logger.info(`[SESSIONCREATOR] Сессия ${session.sessionId} успешно зарегистрирована в глобальном реестре для ${walletAddress} (PID: ${process.pid}).`);

        session.status = SESSION_STATES.PREPARATION;
        sendSessionStarted(ws, session, preparedShip);
        session.stateManager.transitionTo('Preparation');

    } catch (error) {
        logger.error(`[SessionCreator] Ошибка на одном из этапов инициализации сессии ${session.sessionId}: ${error.message}`);
        safeSend(session.ws, {[MK.TYPE]: MT.ERROR, [MK.PAYLOAD]: error.message});
        terminateSession(session, 'initialization_failed');
    }
}

/**
 * Часть 3: "Исполнитель" для асинхронного генератора.
 */
async function runSessionGenerator(generator) {
    for await (const _ of generator) { /* Пустое тело, магия в `for await` */
    }
}

module.exports = {
    createSessionShell,
    sessionInitializationGenerator,
    runSessionGenerator
};

const {SESSION_STATES} = require('./sessionStates');
const CONFIG = require('../../core/config');
const WebSocket = require('ws');
const {gameSessions} = require('./sessions');
const {getActiveSeasonInfo, fetchLeaderboardData} = require('../db/dbManager');
const redis = require('../db/redisClient');
const logger = require('../../core/logger');
const fs = require('fs');
const path = require('path');
const {safeSend} = require('../../utils/networkUtils');
const {MK, MT} = require('../../core/gameStateKeys');
const lootIdManager = require('../../objects/loot/lootIdManager');

function handleDisconnect(ws) {
    if (!ws.sessionId) return;
    const session = gameSessions.get(ws.sessionId);

    if (!session || session.status === 'terminated' || session.status === SESSION_STATES.ENDING) {
        return;
    }

    logger.warn(`[SESSIONTERMINATOR] Сокет отключился для ${session.player}. Ставим на паузу (PAUSED_DISCONNECTED).`);

    session.status = SESSION_STATES.PAUSED_DISCONNECTED;

    if (session.disconnectTimeout) {
        clearTimeout(session.disconnectTimeout);
    }

    session.disconnectTimeout = setTimeout(() => {
        logger.info(`[SESSIONTERMINATOR] Время реконнекта истекло для ${session.player}. Удаляем сессию.`);
        endSession(ws, 'playerDisconnect');
    }, CONFIG.server.RECONNECT_GRACE_PERIOD_MS || 60000);
}

async function endSession(ws, reason = 'playerLoose') {
    const session = gameSessions.get(ws.sessionId);
    if (!session || session.status === 'terminated') {
        return;
    }

    if (session.disconnectTimeout) {
        clearTimeout(session.disconnectTimeout);
        session.disconnectTimeout = null;
    }

    session.status = 'terminated';
    const killCount = session.killCount || 0;

    logger.debug(`[SESSIONTERMINATOR] End session: ${session.sessionId} | Player: ${session.player} | Kills: ${killCount} | Reason: ${reason}`);

    let lootForRedis = {};
    let lootForClient = [];
    let leaderboardData = {status: 'no_season', data: null};

    try {

        const shouldRecordStats = (reason === 'playerWin') || (killCount >= 10);

        if (shouldRecordStats) {
            if (reason === 'playerWin') {
                lootForRedis = filterLoot(session.loot);
                lootForClient = transformLootToArray(session.loot);
            }

            const [_, rankDataResult] = await Promise.all([
                sendSessionResultsToQueue(session, lootForRedis, reason),
                fetchLeaderboardData(session.player)
            ]);
            leaderboardData = rankDataResult;

            logger.info(`[SESSIONTERMINATOR] Stats recorded for ${session.player}. Reason: ${reason}, Kills: ${killCount}`);
        } else {

            logger.info(`[SESSIONTERMINATOR] Stats skipped for ${session.player}. Reason: ${reason}, Low Kills (${killCount} < 10)`);
        }
    } catch (error) {
        logger.error(`[SESSIONTERMINATOR] Ошибка при обработке результатов сессии ${session.sessionId}: ${error.message}.`, session.player);
        lootForClient = [];
        leaderboardData = {status: 'error', data: null, message: error.message};
    }

    if (ws.readyState === WebSocket.OPEN) {
        try {
            const endGamePayload = {
                reason,
                loot: lootForClient,
                sessionStats: {
                    killCount: session.killCount || 0,
                    stageReached: session.currentStageNumber || 0
                },
                leaderboardData: leaderboardData
            };

            safeSend(ws, {
                [MK.TYPE]: MT.END_GAME,
                [MK.PAYLOAD]: endGamePayload
            }, (err) => {

                if (err) {
                    logger.error(`[SESSIONTERMINATOR] Ошибка при отправке END_GAME сообщения для сессии ${ws.sessionId}: ${err.message}`, session.player);
                } else {
                    logger.debug(`[SESSIONTERMINATOR] Финальное END_GAME сообщение успешно отправлено клиенту ${session.player}.`, session.player);
                }

                cleanupSession(session);
            });

        } catch (sendError) {

            logger.error(`[SESSIONTERMINATOR] CRITICAL: (catch block) при отправке END_GAME для ${ws.sessionId}: ${sendError.message}`, session.player);

            cleanupSession(session);
        }
    } else {

        process.nextTick(() => {
            cleanupSession(session);
        });
    }
}

/**
 * Формирует и отправляет результаты сессии в очередь Redis. Не бросает ошибок.
 */
async function sendSessionResultsToQueue(session, loot, reason) {
    const activeSeason = getActiveSeasonInfo();
    const killCount = session.killCount || 0;

    const resultsPayload = {
        walletAddress: session.player?.toLowerCase(),
        sessionId: session.sessionId,
        reason: reason,
        timestamp: Date.now(),
        inventoryPayload: {
            loot: loot
        },
        statsPayload: {
            seasonNumber: activeSeason ? activeSeason.seasonNumber : null,
            maxStage: session.currentStageNumber || 0,
            killCount: killCount,
            gameDurationSeconds: Math.floor((Date.now() - session.startTime) / 1000),
        }
    };

    try {
        await redis.redisClient.lPush('session_results_queue', JSON.stringify(resultsPayload));
        logger.debug(`[SESSIONTERMINATOR] Результаты сессии ${session.sessionId} успешно отправлены в очередь.`, session.player);
    } catch (redisError) {
        const errorMsg = `[SESSIONTERMINATOR] CRITICAL: Не удалось отправить результаты в Redis для ${session.player}: ${redisError.message}`;
        logger.error(errorMsg, session.player);
        await saveLootToFile(session.player, resultsPayload, `redis_error_${redisError.code || 'unknown'}`);
    }
}

/**
 * Очищает и удаляет объект сессии.
 */
async function cleanupSession(session) {
    try {
        await redis.redisClient.hDel('active_game_sessions', session.player?.toLowerCase());
        logger.info(`[SESSIONTERMINATOR] Сессия для ${session.player} удалена из глобального реестра.`);
    } catch (e) {
        logger.error(`[SESSIONTERMINATOR] Ошибка при удалении сессии ${session.sessionId} из реестра Redis.`, e);
    }

    if (session.ws.readyState === WebSocket.OPEN || session.ws.readyState === WebSocket.CLOSING) {
        session.ws.close();
    }
    gameSessions.delete(session.sessionId);
}

/**
 * Фильтрует объект лута, удаляя категории и предметы с нулевым количеством.
 */
function filterLoot(loot) {
    const filteredLoot = {};
    for (const [category, items] of Object.entries(loot)) {
        if (!items || typeof items !== 'object') continue;
        const filteredItems = Object.fromEntries(
            Object.entries(items).filter(([_, quantity]) => quantity > 0)
        );
        if (Object.keys(filteredItems).length > 0) {
            filteredLoot[category] = filteredItems;
        }
    }
    return filteredLoot;
}

function transformLootToArray(lootObject) {
    const lootArray = [];
    if (!lootObject) return lootArray;

    for (const category in lootObject) {
        const items = lootObject[category];
        if (!items || typeof items !== 'object') continue;

        for (const itemName in items) {
            const amount = items[itemName];
            if (amount > 0) {
                const itemId = lootIdManager.getId(itemName);
                if (itemId !== null) {
                    lootArray.push([itemId, amount]);
                } else {
                    logger.warn(`[sessionTerminator] Не удалось найти ID для лута: ${itemName}`);
                }
            }
        }
    }
    return lootArray;
}

/**
 * Сохраняет данные в локальный файл как резервный механизм.
 */
async function saveLootToFile(walletAddress, data, reason) {
    const FAILED_LOOT_DIR = path.join(__dirname, '..', '..', 'logs', 'failed_loot');
    walletAddress = walletAddress?.toLowerCase();
    if (!fs.existsSync(FAILED_LOOT_DIR)) {
        fs.mkdirSync(FAILED_LOOT_DIR, {recursive: true});
    }
    try {
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const fileName = `${walletAddress}_${timestamp}_${reason}.json`;
        const filePath = path.join(FAILED_LOOT_DIR, fileName);
        const dataToSave = {savedAt: new Date().toISOString(), ...data};
        fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2));
        logger.warn(`[SESSIONTERMINATOR] UNSENT RESULTS SAVED to file ${fileName}`, walletAddress);
    } catch (fileError) {
        logger.error(`[SESSIONTERMINATOR] CRITICAL FAILURE: Could not save results to file for ${walletAddress}. DATA IS LOST. Error: ${fileError.message}`, walletAddress);
    }
}

function terminateSession(session, reason = 'playerLoose') {
    if (!session || !session.ws) return;
    endSession(session.ws, reason);
}

module.exports = {endSession, handleDisconnect, terminateSession};
const mongoose = require('mongoose');
const playerSeasonStatsSchema = require('./playerSeasonStatsSchema');
const redis = require('../../core/redisClient');
const seasonService = require('../../services/seasonService');
const logger = require('../../core/logger');

const PlayerSeasonStats = mongoose.model('player_season_stats', playerSeasonStatsSchema);

const SCORE_MULTIPLIER = 1000000;

const FUTURE_TIMESTAMP_REF = 2051222400;

const getKey_Leaderboard = (season) => `leaderboard:season:${season}`;
const getKey_PlayerStats = (season, wallet) => `stats:season:${season}:player:${wallet.toLowerCase()}`;

/**
 * Вспомогательная функция для расчета Redis-счета с учетом времени.
 * @param {number} stage
 * @param {number} kills
 * @param {Date} dateObj - Дата обновления записи (или Date.now())
 */
function calculateRedisScore(stage, kills, dateObj) {

    const gameScore = (stage * SCORE_MULTIPLIER) + kills;

    const timeNowSec = Math.floor(dateObj.getTime() / 1000);

    let timeDiff = FUTURE_TIMESTAMP_REF - timeNowSec;
    if (timeDiff < 0) timeDiff = 0;

    const timeFraction = timeDiff / 10000000000;

    return gameScore + timeFraction;
}

/**
 * Обновление статистики игрока.
 */
async function updatePlayerStats(walletAddress, statsPayload) {
    walletAddress = walletAddress?.toLowerCase();
    const {killCount, maxStage, seasonNumber} = statsPayload;

    if (!seasonNumber) {
        logger.debug(`Статистика для ${walletAddress} не записана: нет сезона.`, `leaderboard`);
        return {success: true, reason: 'No active season'};
    }

    try {

        const updatedStats = await PlayerSeasonStats.findOneAndUpdate(
            {walletAddress: walletAddress, seasonNumber: seasonNumber},
            {
                $max: {
                    bestKills: killCount || 0,
                    maxStage: maxStage || 0
                }
            },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true
            }
        ).lean();

        const finalScore = calculateRedisScore(
            updatedStats.maxStage,
            updatedStats.bestKills,
            updatedStats.updatedAt || new Date()
        );

        const redisCommands = redis.redisClient.multi();

        redisCommands.hSet(getKey_PlayerStats(seasonNumber, walletAddress), {
            maxStage: updatedStats.maxStage,
            bestKills: updatedStats.bestKills,
            walletAddress: walletAddress
        });

        redisCommands.zAdd(getKey_Leaderboard(seasonNumber), {
            score: finalScore,
            value: walletAddress
        });

        await redisCommands.exec();

        logger.debug(`Статистика ${walletAddress} (S:${seasonNumber}) обновлена. Score: ${finalScore}`, `leaderboard`);
        return {success: true};

    } catch (error) {
        logger.error(`Ошибка updatePlayerStats ${walletAddress}: ${error.message}`, `leaderboard`);
        return {success: false, error: 'Failed to update player stats'};
    }
}

/**
 * Прогрев кэша (Hydration)
 */
async function hydrateLeaderboardFromDB(seasonNumber) {
    const logPrefix = `hydrate_season_${seasonNumber}`;

    if (!seasonNumber) {
        logger.info('Прогрев не требуется: нет сезона.', logPrefix);
        return {success: true};
    }

    logger.debug(`Начинаю прогрев лидерборда для сезона ${seasonNumber}...`, logPrefix);

    try {
        const leaderboardKey = getKey_Leaderboard(seasonNumber);

        await redis.redisClient.del(leaderboardKey);

        const cursor = PlayerSeasonStats.find({seasonNumber: seasonNumber}).lean().cursor();

        const zAddPayload = [];
        let playerCount = 0;

        for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {

            const finalScore = calculateRedisScore(
                doc.maxStage,
                doc.bestKills,
                doc.updatedAt || new Date()
            );

            zAddPayload.push({
                score: finalScore,
                value: doc.walletAddress.toLowerCase(),
            });

            await redis.redisClient.hSet(getKey_PlayerStats(seasonNumber, doc.walletAddress), {
                maxStage: doc.maxStage,
                bestKills: doc.bestKills,
                walletAddress: doc.walletAddress
            });

            playerCount++;

            if (zAddPayload.length >= 1000) {
                await redis.redisClient.zAdd(leaderboardKey, zAddPayload);
                zAddPayload.length = 0;
                logger.info(`...прогрето ${playerCount}...`, logPrefix);
            }
        }

        if (zAddPayload.length > 0) {
            await redis.redisClient.zAdd(leaderboardKey, zAddPayload);
        }

        logger.info(`Прогрев завершен. Игроков: ${playerCount}.`, logPrefix);
        return {success: true};

    } catch (error) {
        logger.error(`Ошибка прогрева: ${error.message}`, logPrefix);
        return {success: false, error: error.message};
    }
}

/**
 * Получение топа
 */
async function getLeaderboardTop(seasonNumber, count, offset) {
    const leaderboardKey = getKey_Leaderboard(seasonNumber);
    const topPlayersData = [];

    try {

        const topPlayersWithScores = await redis.redisClient.zRangeWithScores(leaderboardKey, offset, offset + count - 1, {REV: true});

        if (!topPlayersWithScores || topPlayersWithScores.length === 0) {
            return [];
        }

        const multi = redis.redisClient.multi();
        for (const player of topPlayersWithScores) {
            const playerStatsKey = getKey_PlayerStats(seasonNumber, player.value);
            multi.hGetAll(playerStatsKey);
        }
        const playerStatsList = await multi.exec();

        for (let i = 0; i < topPlayersWithScores.length; i++) {
            const rank = offset + i + 1;
            const stats = playerStatsList[i];
            const rawScore = topPlayersWithScores[i].score;

            const displayPts = Math.floor(rawScore);

            if (stats && Object.keys(stats).length > 0) {
                topPlayersData.push({
                    rank: rank,
                    walletAddress: topPlayersWithScores[i].value,
                    maxStage: parseInt(stats.maxStage, 10) || 0,
                    bestKills: parseInt(stats.bestKills, 10) || 0,
                    pts: displayPts
                });
            } else {

                topPlayersData.push({
                    rank: rank,
                    walletAddress: topPlayersWithScores[i].value,
                    maxStage: 0,
                    bestKills: 0,
                    pts: displayPts
                });
            }
        }

        return topPlayersData;

    } catch (error) {
        logger.error(`Ошибка getLeaderboardTop: ${error.message}`, 'leaderboard');
        throw error;
    }
}

/**
 * Получение ранга конкретного игрока
 */
async function getPlayerRank(seasonNumber, walletAddress) {
    walletAddress = walletAddress?.toLowerCase();
    const leaderboardKey = getKey_Leaderboard(seasonNumber);
    const playerStatsKey = getKey_PlayerStats(seasonNumber, walletAddress);

    try {
        const [rank, score, stats] = await Promise.all([
            redis.redisClient.zRevRank(leaderboardKey, walletAddress),
            redis.redisClient.zScore(leaderboardKey, walletAddress),
            redis.redisClient.hGetAll(playerStatsKey)
        ]);

        if (rank === null || score === null) {
            return null;
        }

        const displayPts = Math.floor(score);

        return {
            rank: rank + 1,
            walletAddress: walletAddress,
            maxStage: parseInt(stats.maxStage, 10) || 0,
            bestKills: parseInt(stats.bestKills, 10) || 0,
            pts: displayPts
        };

    } catch (error) {
        logger.error(`Ошибка getPlayerRank ${walletAddress}: ${error.message}`, 'leaderboard');
        throw error;
    }
}

async function handleGetLeaderboard(payload, walletAddressForRank) {
    walletAddressForRank = walletAddressForRank?.toLowerCase();
    const {seasonNumber, count = 50, offset = 0} = payload;

    try {
        let seasonToQueryInfo = null;
        let seasonToQuery = null;

        if (seasonNumber) {
            seasonToQueryInfo = seasonService.getSeasonByNumber(seasonNumber);
        } else {
            seasonToQueryInfo = seasonService.getActiveSeason();
            if (!seasonToQueryInfo) {
                seasonToQueryInfo = seasonService.getLatestConcludedSeason();
            }
        }

        seasonToQuery = seasonToQueryInfo ? seasonToQueryInfo.seasonNumber : null;

        if (!seasonToQueryInfo || !seasonToQuery) {
            return {
                success: true,
                data: {seasonNumber: null, topPlayers: [], playerData: null},
                message: "No active or past season available."
            };
        }

        const [topPlayers, playerData] = await Promise.all([
            getLeaderboardTop(seasonToQuery, count, offset),
            getPlayerRank(seasonToQuery, walletAddressForRank)
        ]);

        return {
            success: true,
            data: {
                seasonNumber: seasonToQuery,
                startDate: seasonToQueryInfo.startDate,
                endDate: seasonToQueryInfo.endDate,
                rewards: seasonToQueryInfo.rewards,
                topPlayers,
                playerData
            }
        };

    } catch (error) {
        logger.error(`Ошибка handleGetLeaderboard: ${error.message}`, 'leaderboard');
        return {success: false, error: 'Failed to retrieve leaderboard data'};
    }
}

module.exports = {
    updatePlayerStats,
    hydrateLeaderboardFromDB,
    getLeaderboardTop,
    getPlayerRank,
    handleGetLeaderboard
};
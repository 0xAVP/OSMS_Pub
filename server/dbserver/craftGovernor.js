const path = require('path');
require('dotenv').config({path: path.resolve(__dirname, '.env')});
const mongoose = require('mongoose');
const schedule = require('node-schedule');
const CONFIG = require('./core/config');
const logger = require('./core/logger');
const redis = require('./core/redisClient');
const {initializeSecrets, getSecret, decryptSecret} = require("./core/secrets");
const {Factory} = require('./modules/factory/factory');
const healthMonitor = require('./core/healthMonitor');

const PILOT_OWNERS_KEY = 'pilot_owners_list';
const GOVERNOR_STATE_KEY = 'craft_governor:active_pilots';
const CRON_SCHEDULE = '* * * * *';

async function pauseCraftForWallets(walletAddresses) {
    if (walletAddresses.length === 0) {
        return;
    }
    const normalizedWallets = walletAddresses.map(w => w.toLowerCase());

    logger.info(`[CraftGovernor] Попытка поставить на ПАУЗУ крафт для ${normalizedWallets.length} кошельков.`, `governor`);
    const factories = await Factory.find({walletAddress: {$in: normalizedWallets}});
    const bulkOps = [];
    const now = Date.now();
    for (const factory of factories) {
        let isModified = false;
        for (const slotKey of ['factory1', 'factory2', 'factory3']) {
            const slot = factory.factories[slotKey];
            if (slot.state === 'crafting') {
                const timeRemaining = Math.max(0, slot.endTime - now);
                slot.state = 'paused';
                slot.timeRemainingMs = timeRemaining;
                slot.endTime = null;
                isModified = true;
            }
        }
        if (isModified) {
            bulkOps.push({
                updateOne: {
                    filter: {_id: factory._id},
                    update: {$set: {factories: factory.factories}}
                }
            });
        }
    }
    if (bulkOps.length > 0) {
        const result = await Factory.bulkWrite(bulkOps);
        logger.info(`[CraftGovernor] Операция паузы завершена. Найдено для обновления: ${result.matchedCount}, Фактически обновлено: ${result.modifiedCount}`, 'governor');
    } else {
        logger.info(`[CraftGovernor] Для указанных кошельков не найдено активных крафтов для постановки на паузу.`, 'governor');
    }
}

async function resumeCraftForWallets(walletAddresses) {
    if (walletAddresses.length === 0) {
        return;
    }
    const normalizedWallets = walletAddresses.map(w => w.toLowerCase());
    logger.info(`[CraftGovernor] Попытка ВОЗОБНОВИТЬ крафт для ${normalizedWallets.length} кошельков.`, `governor`);
    const factories = await Factory.find({walletAddress: {$in: normalizedWallets}});
    const bulkOps = [];
    const now = Date.now();
    for (const factory of factories) {
        let isModified = false;
        for (const slotKey of ['factory1', 'factory2', 'factory3']) {
            const slot = factory.factories[slotKey];

            if (slot.state === 'paused' && typeof slot.timeRemainingMs === 'number') {
                slot.state = 'crafting';
                slot.endTime = now + slot.timeRemainingMs;
                slot.timeRemainingMs = null;
                isModified = true;
            }
        }
        if (isModified) {
            bulkOps.push({
                updateOne: {
                    filter: {_id: factory._id},
                    update: {$set: {factories: factory.factories}}
                }
            });
        }
    }
    if (bulkOps.length > 0) {
        const result = await Factory.bulkWrite(bulkOps);
        logger.info(`[CraftGovernor] Операция возобновления завершена. Найдено для обновления: ${result.matchedCount}, Фактически обновлено: ${result.modifiedCount}`, 'governor');
    } else {
        logger.info(`[CraftGovernor] Для указанных кошельков не найдено крафтов на паузе для возобновления.`, 'governor');
    }
}

async function runGovernorCycle() {
    await healthMonitor.pulse();
    logger.debug('[CraftGovernor] Запуск цикла проверки...', `governor`);
    try {
        const redisClient = redis.redisClient;

        const [previousOwnersArray, currentOwnersArray] = await redisClient
            .multi()
            .sMembers(GOVERNOR_STATE_KEY)
            .sMembers(PILOT_OWNERS_KEY)
            .exec();

        const previousOwners = new Set((previousOwnersArray || []).map(w => w.toLowerCase()));
        const currentOwners = new Set((currentOwnersArray || []).map(w => w.toLowerCase()));

        logger.debug(`[CraftGovernor] Предыдущее состояние: ${previousOwners.size} владельцев. Текущее состояние: ${currentOwners.size} владельцев.`, 'governor');

        const walletsToPause = [...previousOwners].filter(wallet => !currentOwners.has(wallet));
        const walletsToResume = [...currentOwners].filter(wallet => !previousOwners.has(wallet));

        logger.info(`[CraftGovernor] Найдено для паузы: ${walletsToPause.length}. Найдено для возобновления: ${walletsToResume.length}.`, `governor`);

        await Promise.all([
            pauseCraftForWallets(walletsToPause),
            resumeCraftForWallets(walletsToResume)
        ]);

        if (walletsToPause.length > 0 || walletsToResume.length > 0) {
            const multi = redisClient.multi();
            multi.del(GOVERNOR_STATE_KEY);
            if (currentOwners.size > 0) {
                multi.sAdd(GOVERNOR_STATE_KEY, [...currentOwners]);
            }
            await multi.exec();
            logger.info(`[CraftGovernor] Состояние губернатора обновлено.`, `governor`);
        } else {
            logger.debug(`[CraftGovernor] Изменений нет, состояние не обновлялось.`, `governor`);
        }

        logger.debug('[CraftGovernor] Цикл проверки завершен.', `governor`);

    } catch (error) {
        logger.error(`[CraftGovernor] КРИТИЧЕСКАЯ ошибка в цикле губернатора: ${error.message}\n${error.stack}`, `governor`);
    }
}

async function main() {
    logger.info('[CraftGovernor] Запуск воркера "Craft Governor"...');
    try {
        await initializeSecrets();
        const encryptedMongoCred = getSecret(CONFIG.security.infisical.secrets.ENCRYPTED_DB_CRED);
        if (!encryptedMongoCred) throw new Error("DB credentials not found.");
        let mongoCred = await decryptSecret(encryptedMongoCred);
        const connectionString = CONFIG.database.MONGO_URI_START + mongoCred + CONFIG.database.MONGO_URI_END;
        mongoCred = null;
        await mongoose.connect(connectionString);
        await redis.connectRedis();
        healthMonitor.start('governor', 'main', true);
        logger.info('[CraftGovernor] Успешное подключение к MongoDB и Redis.');

        const governorKeyExists = await redis.redisClient.exists(GOVERNOR_STATE_KEY);
        if (!governorKeyExists) {
            logger.warn(`[CraftGovernor] Ключ состояния '${GOVERNOR_STATE_KEY}' не найден. Инициализация...`, 'governor');
            await redis.redisClient.sUnionStore(GOVERNOR_STATE_KEY, PILOT_OWNERS_KEY);
            logger.info(`[CraftGovernor] Ключ состояния успешно инициализирован.`, 'governor');
        }

        schedule.scheduleJob(CRON_SCHEDULE, runGovernorCycle);
        logger.info(`[CraftGovernor] Воркер запланирован с cron-выражением: "${CRON_SCHEDULE}"`);

    } catch (err) {
        logger.error(`[CraftGovernor] КРИТИЧЕСКАЯ ОШИБКА при инициализации: ${err.message}`, 'governor');
        process.exit(1);
    }
}

main();

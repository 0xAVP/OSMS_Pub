require('dotenv').config();
const mongoose = require('mongoose');
const {createClient} = require('redis');
const schedule = require('node-schedule');
const CONFIG = require('./config');
const logger = require('./logger');
const {initializeGracefulShutdown} = require('./gracefulHandler');
const {initializeSecrets, getSecret, decryptSecret} = require("./secrets");

const playerSchema = new mongoose.Schema({
    walletAddress: {
        type: String,
        required: true,
        unique: true,
        index: true,
        lowercase: true,
        trim: true
    },
    nickname: {type: String, required: true},
    exp: {type: Number, default: 0},
    registered: {type: Date, default: Date.now},
});
const Player = mongoose.model('players', playerSchema);

async function main() {

    await initializeSecrets();

    const encryptedMongoCred = getSecret(CONFIG.security.infisical.secrets.ENCRYPTED_DB_CRED);
    if (!encryptedMongoCred) {
        throw new Error(`Учетные данные для БД ('${CONFIG.security.infisical.secrets.ENCRYPTED_DB_CRED}') не найдены в Infisical.`);
    }

    let mongoCred = await decryptSecret(encryptedMongoCred);

    const connectionString = CONFIG.database.MONGO_URI_START + mongoCred + CONFIG.database.MONGO_URI_END;
    await mongoose.connect(connectionString);
    mongoCred = null;
    logger.info('EXP Worker: Успешное подключение к MongoDB.');

    const encryptedRedisPassword = getSecret(CONFIG.security.infisical.secrets.ENCRYPTED_REDIS_PASSWORD);
    if (!encryptedRedisPassword) {
        throw new Error(`Пароль для Redis ('${CONFIG.security.infisical.secrets.ENCRYPTED_REDIS_PASSWORD}') не найден в Infisical.`);
    }

    let redisPassword = await decryptSecret(encryptedRedisPassword);

    let redisClient;

    try {

        redisClient = createClient({
            url: CONFIG.connections.REDIS_URI,
            password: redisPassword
        });

        redisPassword = null;

        redisClient.on('error', (err) => logger.error('EXP Worker: Redis Client Error', err));
        await redisClient.connect();
        logger.info('EXP Worker: Connected to Redis.');

    } catch (error) {

        redisPassword = null;
        throw error;
    }

    const job = async () => {
        const jobStartTime = new Date();
        console.log(`EXP Worker: Job started at ${jobStartTime.toISOString()}`);
        try {

            const owners = await redisClient.sMembers(CONFIG.PILOT_OWNERS_REDIS_KEY);

            if (!owners || owners.length === 0) {
                console.log('EXP Worker: No pilot owners in Redis set. Skipping.');
                return;
            }

            if (!Array.isArray(owners) || owners.length === 0) {
                console.log('EXP Worker: Pilot owners list is empty or invalid. Skipping.');
                return;
            }

            const result = await Player.updateMany(
                {walletAddress: {$in: owners}},
                {$inc: {exp: CONFIG.EXP_TO_ACCRUE}}
            );

            logger.info('EXP Worker: Job finished.', {
                modifiedCount: result.modifiedCount,
                matchedCount: result.matchedCount,
                totalOwnersInList: owners.length,
                durationMs: new Date() - jobStartTime
            });

        } catch (error) {
            console.error('EXP Worker: An error occurred during the job:', error.message);
        }
    };

    schedule.scheduleJob(CONFIG.CRON_SCHEDULE, job);
    console.log(`EXP Worker has been scheduled with cron pattern: "${CONFIG.CRON_SCHEDULE}"`);

    initializeGracefulShutdown(redisClient);
}

main().catch(err => {
    console.error("EXP Worker failed to start:", err);
    process.exit(1);
});
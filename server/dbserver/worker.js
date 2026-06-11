const path = require('path');
require('dotenv').config({path: path.resolve(__dirname, '.env')});
const cluster = require('cluster');
const mongoose = require('mongoose');
const redis = require('./core/redisClient');
const CONFIG = require('./core/config');
const {saveLoot} = require('./modules/inventory/inventory');
const {updatePlayerStats} = require('./modules/leaderboard/leaderboardManager');
const {initializeSecrets, getSecret, decryptSecret} = require("./core/secrets");
const healthMonitor = require('./core/healthMonitor');
const IDLE_POLLING_INTERVAL_MS = 100;
const numWorkers = CONFIG.server.WORKER_CORES_TO_USE;

if (cluster.isMaster) {
    console.log(`[Master Worker] PID: ${process.pid}. Запускаю ${numWorkers} фоновых воркеров...`);

    for (let i = 0; i < numWorkers; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.error(`[Master Worker] Воркер ${worker.process.pid} умер (Code: ${code}). Перезапускаю...`);
        cluster.fork();
    });

} else {
    async function initializeAndRunWorker() {
        try {

            await initializeSecrets();

            const encryptedMongoCred = getSecret(CONFIG.security.infisical.secrets.ENCRYPTED_DB_CRED);
            if (!encryptedMongoCred) {
                throw new Error(`Учетные данные для БД не найдены.`);
            }
            let mongoCred = await decryptSecret(encryptedMongoCred);
            const connectionString = CONFIG.database.MONGO_URI_START + mongoCred + CONFIG.database.MONGO_URI_END;
            mongoCred = null;

            await mongoose.connect(connectionString);
            console.log(`[Worker ${process.pid}] Подключен к MongoDB.`);

            await redis.connectRedis();
            console.log(`[Worker ${process.pid}] Подключен к Redis (Adaptive Mode).`);

            const workerId = cluster.worker ? cluster.worker.id : process.pid;
            healthMonitor.start('worker', workerId, true);

            while (true) {
                try {
                    const message = await redis.redisClient.rPop('session_results_queue');
                    if (message) {
                        const payload = JSON.parse(message);
                        if (!payload.inventoryPayload || !payload.statsPayload) {
                            console.error(`[Worker ${process.pid}] Ошибка: Некорректная структура сообщения.`);

                            continue;
                        }
                        await Promise.all([
                            saveLoot(payload.walletAddress, payload.inventoryPayload.loot),
                            updatePlayerStats(payload.walletAddress, payload.statsPayload)
                        ]);
                        continue;
                    }
                    await new Promise(resolve => setTimeout(resolve, IDLE_POLLING_INTERVAL_MS));

                } catch (jobError) {
                    console.error(`[Worker ${process.pid}] Ошибка обработки задания:`, jobError.message);

                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        } catch (initError) {
            console.error(`[Worker ${process.pid}] КРИТИЧЕСКАЯ ОШИБКА: ${initError.message}. Завершение.`);
            process.exit(1);
        }
    }

    initializeAndRunWorker();
}

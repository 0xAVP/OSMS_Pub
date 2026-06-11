const {spawn} = require('child_process');
const path = require('path');
const CONFIG = require('./core/config');
const WORKER_CORES_TO_USE = CONFIG.server.WORKER_CORES_TO_USE || 1;

function launchProcess(scriptName, processName, env = {}) {
    const scriptPath = path.join(__dirname, scriptName);
    const child = spawn('node', [scriptPath], {
        stdio: 'pipe',
        env: {...process.env, ...env}
    });

    child.stdout.on('data', (data) => {

        process.stdout.write(`[${processName}] ${data.toString()}`);
    });

    child.stderr.on('data', (data) => {
        process.stderr.write(`[${processName}-ERROR] ${data.toString()}`);
    });

    child.on('close', (code) => {
        console.log(`[${processName}] Процесс завершился с кодом ${code}. Перезапуск через 5 секунд...`);

        setTimeout(() => launchProcess(scriptName, processName, env), 5000);
    });

    console.log(`[Starter] Запущен процесс '${processName}' (PID: ${child.pid})`);
}

console.log('[Starter] Запускаю сервисы DBServer...');

launchProcess('api_server.js', 'API-Server');

const workerEnv = {};
if (WORKER_CORES_TO_USE) {
    workerEnv.WORKER_CORES = WORKER_CORES_TO_USE;
}
launchProcess('worker.js', 'Worker-Cluster', workerEnv);
launchProcess('modules/reservations/reservationReconciler.js', 'Reservation-Reconciler');
launchProcess('craftGovernor.js', 'Craft-Governor');
const cluster = require('cluster');
const logger = require('./core/logger');
const {PerformanceObserver} = require('perf_hooks');

const WARMUP_PERIOD_MS = 1000;

function initializeMonitoring() {
    if (cluster.isMaster) {

        const workerStats = {};

        setInterval(() => {
            console.clear();
            logger.info(`--- Live Worker Load & GC Overview (Warmup: ${WARMUP_PERIOD_MS / 1000}s) ---`);
            if (Object.keys(workerStats).length > 0) {

                const sortedPids = Object.keys(workerStats).sort((a, b) => a - b);
                const sortedStats = {};
                for (const pid of sortedPids) {
                    sortedStats[pid] = workerStats[pid];
                }
                console.table(sortedStats);
            } else {
                console.log('Waiting for workers to finish warmup...');
            }
        }, 3000);

        const messageHandler = (worker, msg) => {
            if (!msg || !msg.type) return;

            switch (msg.type) {
                case 'worker_warming_up':

                    workerStats[worker.process.pid] = {Status: 'Warming up...'};
                    break;

                case 'worker_stats':

                    workerStats[worker.process.pid] = {
                        'CPU (%)': msg.payload.cpu_percent,
                        'Max CPU (%)': msg.payload.max_cpu,
                        'RAM (MB)': msg.payload.ram_mb,
                        'Sessions': msg.payload.sessions,
                        'GC Pauses (ms)': msg.payload.gc_pause_ms.toFixed(2),
                        'Max GC Pause (ms)': msg.payload.max_gc_pause_ms.toFixed(2),
                        'Total GC (s)': msg.payload.gc_total_s.toFixed(2),
                        'GC Count': msg.payload.gc_count,
                        'Last GC Type': msg.payload.gc_last_type,
                        'Last Update': new Date().toLocaleTimeString()
                    };
                    break;
            }

        };

        cluster.on('fork', (worker) => {
            worker.on('message', (msg) => messageHandler(worker, msg));
        });

        cluster.on('exit', (worker) => {
            delete workerStats[worker.process.pid];
        });

    } else {

        const {gameSessions} = require('./modules/session/sessions');

        let lastCpuUsage, lastCpuTime;
        let maxCpu, totalGcTimeMs, gcCount, lastGcPauseMs, lastGcType, maxGcPauseMs;
        let monitoringInterval;

        function resetStats() {
            lastCpuUsage = process.cpuUsage();
            lastCpuTime = Date.now();
            maxCpu = 0;
            totalGcTimeMs = 0;
            gcCount = 0;
            lastGcPauseMs = 0;
            lastGcType = 'N/A';
            maxGcPauseMs = 0;
            logger.info(`Worker ${process.pid}: Stats have been reset after warmup.`);
        }

        process.send({type: 'worker_warming_up'});

        setTimeout(() => {
            resetStats();

            monitoringInterval = setInterval(() => {
                if (!process.connected) {
                    clearInterval(monitoringInterval);
                    return;
                }

                const currentRamMb = parseFloat((process.memoryUsage().rss / 1024 / 1024).toFixed(2));
                const currentCpuUsage = process.cpuUsage(lastCpuUsage);
                const currentTime = Date.now();
                const elapsedTimeUs = (currentTime - lastCpuTime) * 1000;
                const elapsedCpuTimeUs = currentCpuUsage.user + currentCpuUsage.system;
                const currentCpuPercent = parseFloat(((elapsedCpuTimeUs / elapsedTimeUs) * 100).toFixed(2));

                if (currentCpuPercent > maxCpu) {
                    maxCpu = currentCpuPercent;
                }

                process.send({
                    type: 'worker_stats',
                    payload: {
                        pid: process.pid,
                        ram_mb: currentRamMb,
                        cpu_percent: currentCpuPercent,
                        max_cpu: maxCpu,
                        sessions: gameSessions.size,
                        gc_pause_ms: lastGcPauseMs,
                        max_gc_pause_ms: maxGcPauseMs,
                        gc_total_s: totalGcTimeMs / 1000,
                        gc_count: gcCount,
                        gc_last_type: lastGcType
                    }
                });

                lastGcPauseMs = 0;
                lastGcType = 'N/A';
                lastCpuUsage = process.cpuUsage();
                lastCpuTime = currentTime;
            }, 3000);

        }, WARMUP_PERIOD_MS);

        const gcObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                gcCount++;
                totalGcTimeMs += entry.duration;
                lastGcPauseMs = entry.duration;

                if (entry.duration > maxGcPauseMs) {
                    maxGcPauseMs = entry.duration;
                }

                switch (entry.kind) {
                    case 1:
                        lastGcType = 'Minor';
                        break;
                    case 2:
                        lastGcType = 'Major';
                        break;
                    case 4:
                        lastGcType = 'Incremental';
                        break;
                    case 8:
                        lastGcType = 'WeakCB';
                        break;
                    default:
                        lastGcType = 'Unknown';
                        break;
                }
            }
        });
        gcObserver.observe({entryTypes: ['gc'], buffered: true});
    }
}

module.exports = {initializeMonitoring};
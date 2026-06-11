const redis = require('../core/redisClient');
const {isProviderConnected} = require('../contracts/contracts');
const {getDbStatus} = require('./dbconnection');
const {getTrackerStatus} = require('./pilotsOwnersTracker');
const logger = require('../core/logger');

const CACHE_TTL_MS = 15 * 1000;

let cachedReport = null;
let lastCheckTime = 0;

/**
 * Форматирует аптайм в читаемый вид (чч:мм:сс)
 */
function formatUptime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
}

/**
 * Проверяет состояние здоровья сервиса и его зависимостей.
 * Структура ответа унифицирована с другими микросервисами.
 */
async function checkHealth() {
    const now = Date.now();

    if (cachedReport && (now - lastCheckTime < CACHE_TTL_MS)) {
        return {...cachedReport, source: 'cache'};
    }

    const uptimeSec = process.uptime();
    const memoryUsage = process.memoryUsage();

    const report = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        source: 'live',
        system: {
            pid: process.pid,
            uptime: formatUptime(uptimeSec),
            uptime_sec: Math.floor(uptimeSec),
            memory_rss_mb: Math.round(memoryUsage.rss / 1024 / 1024),
            memory_heap_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024)
        },
        data: {
            api: 'OK',
            cache: 'OK',
            rpc: 'OK',
            alchemy: 'OK'
        },
        services: {}
    };

    const {dbConnected, identified} = getDbStatus();
    if (!dbConnected) {
        report.data.api = 'ERROR';
        report.status = 'error';
    } else if (!identified) {
        report.data.api = 'Handshake Pending';
        report.status = 'warning';
    }

    try {
        if (!redis.redisClient.isOpen) {
            report.data.cache = 'ERROR';
            report.status = 'error';
        } else {
            const pong = await redis.redisClient.ping();
            if (pong !== 'PONG') {
                report.data.cache = 'ERROR';
                report.status = 'error';
            }
        }
    } catch (e) {
        report.data.cache = 'ERROR';
        report.status = 'error';
        logger.error('[HealthCheck] Redis check failed', e);
    }

    if (!isProviderConnected()) {
        report.data.rpc = 'ERROR';
        report.status = 'error';
    }

    const trackerStatus = getTrackerStatus();
    if (!trackerStatus.isHealthy) {
        report.data.alchemy = 'ERROR';

        if (report.status !== 'error') report.status = 'warning';
    }

    const serviceName = 'web3server';

    report.services[serviceName] = [
        {
            id: process.env.INSTANCE_ID || 'main',
            status: 'ONLINE',
            last_seen_seconds: 0,
            pid: process.pid,
            uptime: formatUptime(uptimeSec),
            memory_mb: Math.round(memoryUsage.rss / 1024 / 1024),
            details: {
                alchemy_last_update: trackerStatus.lastSuccessfulUpdate
            }
        }
    ];

    cachedReport = report;
    lastCheckTime = now;

    return report;
}

module.exports = {checkHealth};

const mongoose = require('mongoose');
const redis = require('../core/redisClient');
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
 * Проверяет состояние здоровья сервиса.
 * Генерирует ответ в формате, идентичном системному монитору (dbserver).
 */
async function checkHealth() {
    const now = Date.now();

    if (cachedReport && (now - lastCheckTime < CACHE_TTL_MS)) {
        return {...cachedReport, source: 'cache'};
    }

    const report = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        source: 'live',
        data: {
            data: 'OK',
            cache: 'OK'
        },
        services: {}
    };

    try {
        if (mongoose.connection.readyState !== 1) {
            report.data.data = 'ERROR';
            report.status = 'error';
        }
    } catch (e) {
        report.data.data = 'ERROR';
        report.status = 'error';
        logger.error('[HealthCheck] Mongo check failed', e);
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

    const serviceName = 'metadata-server';
    const uptimeSec = process.uptime();
    const memoryUsage = process.memoryUsage();

    report.services[serviceName] = [
        {
            id: process.env.INSTANCE_ID || 'main',
            status: 'ONLINE',
            last_seen_seconds: 0,
            pid: process.pid,
            uptime: formatUptime(uptimeSec),
            memory_mb: Math.round(memoryUsage.rss / 1024 / 1024)
        }
    ];

    cachedReport = report;
    lastCheckTime = now;

    return report;
}

module.exports = {checkHealth};

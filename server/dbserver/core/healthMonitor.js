const redis = require('./redisClient');
const mongoose = require('mongoose');
const logger = require('./logger');

const HEARTBEAT_PREFIX = 'health:';
const UPDATE_INTERVAL_MS = 60 * 1000;
const STALE_THRESHOLD_MS = 180 * 1000;
const REDIS_KEY_TTL = 60 * 10;

const CACHE_TTL_MS = 15 * 1000;

const EXPECTED_SINGLETONS = ['api', 'governor', 'reconciler'];

class HealthMonitor {
    constructor() {
        this.serviceName = null;
        this.instanceId = null;
        this.timer = null;

        this.cachedReport = null;
        this.lastCheckTime = 0;
    }

    start(serviceName, instanceId, autoStart = true) {
        this.serviceName = serviceName;
        this.instanceId = instanceId;

        logger.info(`[HealthMonitor] Monitoring started for ${serviceName}:${instanceId}`);
        this.pulse().catch(err => console.error('[HealthMonitor] First pulse failed', err));

        if (autoStart) {
            this.timer = setInterval(() => {
                this.pulse().catch(() => {
                });
            }, UPDATE_INTERVAL_MS);
            this.timer.unref();
        }
    }

    async pulse() {
        if (!this.serviceName || !redis.redisClient?.isOpen) return;
        try {
            const key = `${HEARTBEAT_PREFIX}${this.serviceName}:${this.instanceId}`;
            const payload = JSON.stringify({
                ts: Date.now(),
                pid: process.pid,
                mem: process.memoryUsage().rss,
                uptime: process.uptime()
            });
            await redis.redisClient.set(key, payload, {EX: REDIS_KEY_TTL});
        } catch (error) {
        }
    }

    /**
     * Возвращает отчет о здоровье.
     * Использует кэширование для снижения нагрузки на Redis/Mongo.
     */
    async getSystemHealth() {
        const now = Date.now();

        if (this.cachedReport && (now - this.lastCheckTime < CACHE_TTL_MS)) {

            return {...this.cachedReport, source: 'cache'};
        }

        const report = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            source: 'live',
            data: {
                data: mongoose.connection.readyState === 1 ? 'OK' : 'ERROR',
                cache: (redis.redisClient && redis.redisClient.isOpen) ? 'OK' : 'ERROR'
            },
            services: {}
        };

        if (report.data.data !== 'OK' || report.data.cache !== 'OK') {
            report.status = 'error';
            this._updateCache(report);
            return report;
        }

        try {
            const keys = await redis.redisClient.keys(`${HEARTBEAT_PREFIX}*`);
            const foundSingletons = new Set();

            if (keys.length > 0) {
                const values = await Promise.all(keys.map(key => redis.redisClient.get(key)));

                keys.forEach((fullKey, index) => {
                    const parts = fullKey.split(':');
                    const sName = parts[1];
                    const sId = parts[2];

                    let data = {};
                    try {
                        data = JSON.parse(values[index]);
                    } catch (e) {
                    }

                    const lastSeenMs = now - (data.ts || 0);
                    const isAlive = lastSeenMs < STALE_THRESHOLD_MS;

                    let status = 'ONLINE';
                    if (!isAlive) status = 'OFFLINE';

                    if (!report.services[sName]) report.services[sName] = [];

                    report.services[sName].push({
                        id: sId,
                        status: status,
                        last_seen_seconds: Math.floor(lastSeenMs / 1000),
                        pid: data.pid,
                        uptime: formatUptime(data.uptime || 0),
                        memory_mb: data.mem ? Math.round(data.mem / 1024 / 1024) : 0
                    });

                    if (status === 'OFFLINE') {
                        report.status = 'warning';
                    }
                    foundSingletons.add(sName);
                });
            }

            EXPECTED_SINGLETONS.forEach(reqService => {
                if (!foundSingletons.has(reqService)) {
                    if (!report.services[reqService]) report.services[reqService] = [];
                    report.services[reqService].push({
                        id: 'main',
                        status: 'MISSING_DATA',
                        error: 'No heartbeat data found'
                    });
                    report.status = 'warning';
                }
            });

        } catch (error) {
            report.status = 'error';
            report.error = error.message;
        }

        this._updateCache(report);
        return report;
    }

    _updateCache(report) {
        this.cachedReport = report;
        this.lastCheckTime = Date.now();
    }
}

function formatUptime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
}

module.exports = new HealthMonitor();

const winston = require('winston');
const path = require('path');
require('winston-daily-rotate-file');

const auditLevels = {
    audit: 0
};

const auditColors = {
    audit: 'cyan'
};

winston.addColors(auditColors);

const logDir = path.join(__dirname, '..', 'logs');

const auditFileTransport = new winston.transports.DailyRotateFile({
    level: 'audit',
    filename: path.join(logDir, 'audit', 'craft_audit-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',

    format: winston.format.printf(info => `${JSON.stringify(info.message)}`)
});

const auditLogger = winston.createLogger({
    levels: auditLevels,
    transports: [
        auditFileTransport
    ],
    exitOnError: false
});

if (process.env.NODE_ENV === 'development') {
    auditLogger.add(new winston.transports.Console({
        level: 'audit',
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(info => `[AUDIT] ${JSON.stringify(info.message, null, 2)}`)
        )
    }));
}

/**
 * Обертка для удобного вызова.
 * @param {string} stage - Название этапа (например, 'CRAFT_INITIATED').
 * @param {object} data - Объект с данными для логирования (walletAddress, traceId и т.д.).
 */
function logCraftAttempt(stage, data) {
    const logObject = {
        timestamp: new Date().toISOString(),
        stage,
        ...data
    };
    auditLogger.audit(logObject);
}

module.exports = {logCraftAttempt};
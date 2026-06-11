const winston = require('winston');
const path = require('path');
require('winston-daily-rotate-file');

const LOG_CONFIG = {

    consoleLevel: 'debug',

    fileLevel: 'info'
};

const levels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
};

const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'white',
};
winston.addColors(colors);

const logFormat = winston.format.printf(
    (info) => `${info.timestamp} [Worker ${process.pid}] ${info.level}: ${info.message}`
);

const fileFormat = winston.format.combine(
    winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss:ms'}),
    winston.format.splat(),
    logFormat
);

const consoleFormat = winston.format.combine(
    winston.format.colorize({all: true}),
    winston.format.splat(),
    fileFormat
);

const LOG_DIR = path.join(__dirname, '..', 'logs');

const transports = [

    new winston.transports.Console({
        level: LOG_CONFIG.consoleLevel,
        format: consoleFormat
    }),

    new winston.transports.DailyRotateFile({
        level: 'error',
        filename: path.join(LOG_DIR, 'errors', 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        format: fileFormat,
    }),

    new winston.transports.DailyRotateFile({
        level: LOG_CONFIG.fileLevel,
        filename: path.join(LOG_DIR, 'combined', 'combined-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '7d',
        format: fileFormat,
    }),
];

const logger = winston.createLogger({

    level: 'debug',
    levels,
    transports,
    exitOnError: false,
});

module.exports = logger;
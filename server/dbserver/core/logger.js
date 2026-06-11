const winston = require('winston');
const path = require('path');
require('winston-daily-rotate-file');

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

const level = () => {
    const env = process.env.NODE_ENV || 'dev';
    return env === 'dev' ? 'debug' : 'info';
};

const customPrintf = winston.format.printf(({timestamp, level, message, context}) => {
    const contextString = context ? ` [context: ${context}]` : '';
    return `${timestamp} ${level}: ${message}${contextString}`;
});

const fileFormat = winston.format.combine(
    winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss:ms'}),
    customPrintf
);

const consoleFormat = winston.format.combine(
    winston.format.colorize({all: true}),
    fileFormat
);

const LOG_DIR = path.join(__dirname, '..', 'logs');

const transports = [

    new winston.transports.Console({
        format: consoleFormat,
    }),

    new winston.transports.DailyRotateFile({
        level: 'info',
        filename: path.join(LOG_DIR, 'info', 'dbserver-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        format: fileFormat,
    }),

    new winston.transports.DailyRotateFile({
        level: 'error',
        filename: path.join(LOG_DIR, 'errors', 'dbserver-error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        format: fileFormat,
    }),
    new winston.transports.DailyRotateFile({
        level: 'debug',
        filename: path.join(LOG_DIR, 'errors', 'dbserver-debug-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        format: fileFormat,
    }),
];

const winstonLogger = winston.createLogger({
    level: level(),
    levels,
    transports,
    exitOnError: false,
});

const logger = {};
Object.keys(levels).forEach((logLevel) => {
    logger[logLevel] = (message, context) => {
        if (context) {

            winstonLogger[logLevel](message, {context});
        } else {

            winstonLogger[logLevel](message);
        }
    };
});

module.exports = logger;
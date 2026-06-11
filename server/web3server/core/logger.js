const winston = require('winston');
const path = require('path');

require('winston-daily-rotate-file');

const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

const level = () => {
    const env = process.env.NODE_ENV || 'development';
    return env === 'development' ? 'debug' : 'info';
};

const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};
winston.addColors(colors);

const fileFormat = winston.format.combine(
    winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss:ms'}),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
    )
);

const consoleFormat = winston.format.combine(
    winston.format.colorize({all: true}),
    fileFormat
);

const logDir = path.join(__dirname, '..', 'logs');

const transports = [

    new winston.transports.Console({
        format: consoleFormat
    }),

    new winston.transports.DailyRotateFile({
        level: 'error',
        filename: path.join(logDir, 'errors', 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        format: fileFormat,
    }),

    new winston.transports.DailyRotateFile({
        level: 'http',
        filename: path.join(logDir, 'http', 'http-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '7d',
        format: fileFormat,
    }),

    new winston.transports.DailyRotateFile({
        filename: path.join(logDir, 'combined', 'all-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        format: fileFormat,
    }),
];

const logger = winston.createLogger({
    level: level(),
    levels,
    transports,
    exitOnError: false,
});

logger.stream = {
    write: (message) => {
        logger.http(message.substring(0, message.lastIndexOf('\n')));
    },
};

module.exports = logger;
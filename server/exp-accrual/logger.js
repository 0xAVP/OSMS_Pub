const winston = require('winston');
const path = require('path');

require('winston-daily-rotate-file');

const levels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
};

const level = () => {
    const env = process.env.NODE_ENV || 'development';
    return env === 'development' ? 'debug' : 'info';
};

const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'white',
};
winston.addColors(colors);

const customPrintf = winston.format.printf(({timestamp, level, message, ...meta}) => {
    const logMessage = `${timestamp} ${level}: ${message}`;

    if (Object.keys(meta).length) {
        return `${logMessage} ${JSON.stringify(meta, null, 2)}`;
    }
    return logMessage;
});

const fileFormat = winston.format.combine(
    winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss:ms'}),
    customPrintf
);

const consoleFormat = winston.format.combine(
    winston.format.colorize({all: true}),
    fileFormat
);

const logDir = path.join(__dirname, 'logs');

const transports = [

    new winston.transports.Console({
        format: consoleFormat,
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

module.exports = logger;
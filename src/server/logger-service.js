const winston = require('winston');
require('winston-daily-rotate-file');

const fileTransport = new winston.transports.DailyRotateFile({
    filename: 'logs/baidu-translate-%DATE%.log',
    datePattern: 'YYYY-MM-DD-HH',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '7d'
});

const consoleTransport = new winston.transports.Console({
    format: winston.format.simple(),
})

const logger = winston.createLogger({
    transports: [
        fileTransport,
        consoleTransport
    ]
});

module.exports = { logger };
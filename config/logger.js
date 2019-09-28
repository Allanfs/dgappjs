const { createLogger, format, transports } = require('winston');

const fc = format.combine(
  format.colorize(),
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(
    (info) => `[${info.timestamp}] [${info.level}]: ${info.message}`
  )
);

module.exports = createLogger({
  transports: [
    new transports.Console({
      level: 'debug',
      format: fc
    })
  ]
});

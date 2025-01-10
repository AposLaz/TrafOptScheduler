import winston from 'winston';

export const logger: winston.Logger = winston.createLogger({
  transports: [new winston.transports.Console()],
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD hh:mm:ss.SSS A', // 2022-01-25 03:23:10.350 PM
    }),
    winston.format.align(),
    winston.format.printf(
      (info) => `[${info.timestamp}] ${info.level}: ${info.message}`
    ),
    winston.format.colorize({
      all: true,
      colors: {
        info: 'green',
        error: 'red',
        warning: 'orange',
      },
    })
  ),
});

export const loggerOperationInfo = (info: string) => {
  logger.info(
    `##############################################################################################################`
  );
  logger.info(info);
  logger.info(
    `##############################################################################################################`
  );
};

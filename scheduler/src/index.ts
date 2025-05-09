import { app } from './app.js';
import { Config } from './config/config.js';
import { logger } from './config/logger.js';
import './config/setup.js';
import { TrafficScheduler } from './cronjobs/trafOptScheduler.js';

const initRestApi = async () => {
  app.listen(Config.APP_PORT, () => {
    logger.info(`Healthcheck api is running in port: ${Config.APP_PORT}`);
  });
};

initRestApi().catch((error: unknown) => {
  const err = error as Error;
  logger.error(`Could not setup api ${err.message}`);
});

TrafficScheduler();

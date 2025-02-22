import { app } from './app';
import { Config } from './config/config';
import { logger } from './config/logger';
import './config/setup';
import { TrafficScheduler } from './trafficScheduler';

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

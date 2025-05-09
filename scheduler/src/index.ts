import { app } from './app.ts';
import { Config } from './config/config.ts';
import { logger } from './config/logger.ts';
import './config/setup.ts';
import { TrafficScheduler } from './core/index.ts';

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

/* eslint-disable @typescript-eslint/no-unused-vars */
import { app } from './app';
import { Config } from './config/config';
import { logger } from './config/logger';
import { scheduler } from './services/k8s.scheduler.service';

const initRestApi = async () => {
  app.listen(Config.APP_PORT, () => {
    logger.info(`Healthcheck api is running in port: ${Config.APP_PORT}`);
  });
};

initRestApi().catch((error: unknown) => {
  const err = error as Error;
  logger.error(`Could not setup api ${err.message}`);
});

const initSetup = async () => {
  try {
    await scheduler();
  } catch (error: unknown) {
    logger.error('Error during setup:', error);
  }
};

initSetup();

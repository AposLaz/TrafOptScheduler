/* eslint-disable @typescript-eslint/no-unused-vars */
import { app } from './app';
import { Config } from './config/config';
import { logger } from './config/logger';
import './config/setup';
import { checkNotReadyPodsInQueue } from './services/queue.notReadyPods.service';

const initRestApi = async () => {
  app.listen(Config.APP_PORT, () => {
    logger.info(`Healthcheck api is running in port: ${Config.APP_PORT}`);
  });
};

initRestApi().catch((error: unknown) => {
  const err = error as Error;
  logger.error(`Could not setup api ${err.message}`);
});

const deployModels = {
  deploymentName: 'server-app-deployment',
  namespace: 'default',
  deletePod: 'server-app-deployment-febfcf83-d3vr', // delete a random pod from another node
};

const initSetup = async () => {
  try {
    // check if all deploys are ready in background
    Promise.all([checkNotReadyPodsInQueue()]).then(() => {
      logger.info('All Deploys are ready');
    });

    //await scheduler();
  } catch (error: unknown) {
    logger.error('Error during setup:', error);
  }
};

initSetup();

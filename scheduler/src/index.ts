/* eslint-disable @typescript-eslint/no-unused-vars */
import { app } from './app';
import { Config } from './config/config';
import { logger } from './config/logger';
import './config/setup';
import { findReschedulePods } from './services/find.rescheduling.pods.service';
import {
  getAppsApiClient,
  getCoreApiClient,
} from './services/k8s/k8s.client.service';
import { checkNotReadyPodsInQueue } from './services/queue.notReadyPods.service';
import { scheduler } from './services/scheduler.service';

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
    // check if all deploys are ready in background
    // /*Promise.all([checkNotReadyPodsInQueue()]).then(() => {
    //   logger.info('All Deploys are ready');
    // });*/
    const apiK8sClient = getCoreApiClient();
    const appsApiK8sClient = getAppsApiClient();
    for (const namespace of Config.NAMESPACES) {
      try {
        const res = await findReschedulePods(
          apiK8sClient,
          appsApiK8sClient,
          namespace
        );

        if (!res) {
          logger.info(`No pods to reschedule in namespace: ${namespace}`);
          continue;
        }

        console.log(res);
        await scheduler(apiK8sClient, appsApiK8sClient, res);
      } catch (error) {
        logger.error(`Error reschedule pods in namespace: ${namespace}`);
        logger.error(error);
      }
    }
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Could not setup api`);
    throw new Error(err.message);
  }
};

initSetup();

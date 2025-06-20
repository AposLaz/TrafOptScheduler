import cron from 'node-cron';

import { TrafficScheduler } from '../core/trafOptScheduler/index.js';
import { logger } from '../config/logger.js';
import { KubernetesAdapterImpl } from '../adapters/k8s/index.js';

let isRunning = false;

export const TrafOptSchedulerCron = (timer: string) => {
  cron.schedule(timer, async () => {
    if (isRunning) {
      logger.warn('Previous cron job is still running. Skipping this cycle.');
      return;
    }

    isRunning = true;
    try {
      logger.info('Starting TrafficScheduler cron job');
      await TrafficScheduler();
    } catch (error: unknown) {
      const err = error as Error;
      logger.error('Error running TrafficScheduler');
      logger.error(err);
    } finally {
      isRunning = false;
    }
  });
};

export const AddLocalityLabelsToNodes = () => {
  cron.schedule('*/10 * * * * *', async () => {
    try {
      logger.info('Starting addLocalityLabelsToNodes cron job');
      const k8sAdapter = new KubernetesAdapterImpl();
      // do not block
      await k8sAdapter.addLocalityLabels();
      logger.info('Finished addLocalityLabelsToNodes cron job');
    } catch (error: unknown) {
      const err = error as Error;
      logger.error('Error running addLocalityLabelsToNodes');
      logger.error(err);
    }
  });
};

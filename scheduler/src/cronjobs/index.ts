import cron from 'node-cron';

import { TrafficScheduler } from './trafOptScheduler.js';
import { logger } from '../config/logger.js';

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
      logger.error('Error running TrafficScheduler:', err.message);
    } finally {
      isRunning = false;
    }
  });
};

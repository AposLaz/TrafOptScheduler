import * as k8s from '@kubernetes/client-node';
import { logger } from '../../config/logger';

export const podHandler = (type: string, obj: k8s.V1Pod, namespace: string) => {
  if (type === 'ADDED') {
    logger.info(`[${namespace}] New Pod Added: ${obj.metadata?.name}`);
    // TODO run optTraffic
    logger.warn(`run OptTraffic`);
  } else if (type === 'DELETED') {
    logger.info(`[${namespace}] Pod Deleted: ${obj.metadata?.name}`);
    // TODO run optTraffic
    logger.warn(`run OptTraffic`);
  }
};

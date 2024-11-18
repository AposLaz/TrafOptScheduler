/* eslint-disable @typescript-eslint/no-explicit-any */
import * as k8s from '@kubernetes/client-node';
import { logger } from '../../config/logger';
import { PodWatcherConfigs } from '../types';
import { podsWatcher } from '../watchers';
import { namespacesExclude } from '../../enums';

export const namespaceHandler = (
  type: string,
  obj: k8s.V1Namespace,
  podConfigs: PodWatcherConfigs,
  podWatchersMap: Map<string, any>
) => {
  const namespace = obj.metadata?.name as string;

  if (namespacesExclude.includes(namespace)) return; // exclude namespaces from watchers

  if (type === 'ADDED') {
    logger.info(`New Namespace Added: ${namespace}`);

    podsWatcher(
      namespace,
      podConfigs.k8sClient,
      podConfigs.startTime,
      podConfigs.k8sApi
    )
      .then((watchRequest) => {
        podWatchersMap.set(namespace, watchRequest);
      })
      .catch((err: unknown) => {
        logger.error(
          `Failed to setup pod watcher for namespace ${namespace}: ${err}`
        );
      });
  } else if (type === 'DELETED') {
    logger.info(`Namespace Deleted: ${namespace}`);
    // get pod watcher for specific namespace
    const watchRequest = podWatchersMap.get(namespace);

    // if watcher exists then terminate it
    if (watchRequest) {
      watchRequest.abort();
      podWatchersMap.delete(namespace);
      logger.info(`Aborted pod watcher for namespace ${namespace}`);
    }
  }
};

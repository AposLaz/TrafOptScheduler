/* eslint-disable @typescript-eslint/no-explicit-any */
// Load the default Kubernetes config (usually in ~/.kube/config)
import * as k8s from "@kubernetes/client-node";
import { getK8sClient } from "../config/k8sClient";
import { namespacesExclude } from "../enums";
import { namespaceWatcher, podsWatcher } from "./watchers";
import { logger } from "../config/logger";

// add watcher for all pods here
const podWatchersMap = new Map<string, any>();

export const setupWatchers = async (): Promise<void> => {
  const k8sClient = getK8sClient();
  const k8sApi = k8sClient.makeApiClient(k8s.CoreV1Api);

  // get all namespaces for first time
  const response = await k8sApi.listNamespace();

  const namespaces = response.body.items
    .map((ns) => ns.metadata?.name)
    .filter(
      (nsName): nsName is string =>
        typeof nsName === "string" && !namespacesExclude.includes(nsName)
    );

  // time in which we start see namespaces
  const startTime = response.body.metadata?.resourceVersion ?? "0";

  // setup namespace watcher => for each new namespace create a new pod watcher. delete pod watcher for each deleted namespace
  logger.info(`[WATCHERS NAMESPACES] => setup [namespaces] watcher`);
  namespaceWatcher(k8sClient, startTime, k8sApi, podWatchersMap);

  if (namespaces.length > 0) {
    // for each namespace setup pod watcher
    for (const namespace of namespaces) {
      try {
        const podRequestWatcher = podsWatcher(
          namespace,
          k8sClient,
          startTime,
          k8sApi
        );
        podWatchersMap.set(namespace, podRequestWatcher); // add new watcher to map
      } catch (error) {
        logger.error(
          `[WATCHERS PODS] => could not setup [pods] watcher for namespace ${namespace}`
          // todo add reinitializer for this pod
        );
      }
    }
  } else {
    logger.warn(`[WATCHERS] => no namespaces for pods found`);
  }
};

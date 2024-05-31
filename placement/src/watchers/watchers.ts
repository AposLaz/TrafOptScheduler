/* eslint-disable @typescript-eslint/no-explicit-any */
import { sleep } from "../common/helper";
import { logger } from "../config/logger";
import { podHandler, namespaceHandler } from "./handlers";
import * as k8s from "@kubernetes/client-node";
import { PodWatcherConfigs } from "./types";

// this watcher is responsible for find added or deleted pods
// watcher has any type
export const podsWatcher = async (
  namespace: string,
  k8sClient: k8s.KubeConfig,
  startTime: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  k8sApi: k8s.CoreV1Api
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> => {
  logger.info(
    `[WATCHERS PODS] => setup pods watcher for namespace: [${namespace}]`
  );
  const watch = new k8s.Watch(k8sClient);

  try {
    const requestPodWatcher = await watch.watch(
      `/api/v1/namespaces/${namespace}/pods`,
      { resourceVersion: startTime },
      (type: string, obj: k8s.V1Pod) => {
        try {
          podHandler(type, obj, namespace);
        } catch (err) {
          logger.error(`Error handling namespace event: ${err}`);
        }
      },
      (err: unknown) => {
        const error = err as Error;
        // if watcher just aborted manually then there is not an error
        if (error.message !== "aborted") {
          logger.error(`Error occurred while watching namespaces: ${error}`);
          //reinitializePodWatcher(k8sClient, k8sApi); // Reinitialize watcher on error
        } else {
          logger.info(`Pod watch for namespace [${namespace}] ended.`);
        }
      }
    );

    return requestPodWatcher;
  } catch (err: unknown) {
    const error = err as k8s.ERROR;
    logger.error(`Failed to set up namespace watch: ${error}`);
    //reinitializePodWatcher(k8sClient, k8sApi); // Reinitialize watcher on catch
  }
};

// this watcher watch for create or delete namespaces
export const namespaceWatcher = async (
  k8sClient: k8s.KubeConfig,
  startTime: string,
  k8sApi: k8s.CoreV1Api,
  podWatchersMap: Map<string, any>
) => {
  const watch = new k8s.Watch(k8sClient);

  // all that need podsHandler
  const ConfigPodWatcher: PodWatcherConfigs = {
    k8sClient,
    startTime,
    k8sApi,
  };

  try {
    await watch.watch(
      "/api/v1/namespaces",
      { resourceVersion: startTime },
      (type: string, obj: k8s.V1Namespace) => {
        try {
          namespaceHandler(type, obj, ConfigPodWatcher, podWatchersMap);
        } catch (err) {
          logger.error(`Error handling namespace event: ${err}`);
        }
      },
      (err: unknown) => {
        const error = err as k8s.ERROR;
        logger.error(`Error occurred while watching namespaces: ${error}`);
        reinitializeNamespaceWatcher(k8sClient, k8sApi, podWatchersMap); // Reinitialize watcher on error
      }
    );
    logger.info("Watching all namespaces...");
  } catch (err: unknown) {
    const error = err as k8s.ERROR;
    logger.error(`Failed to set up namespace watch: ${error}`);
    reinitializeNamespaceWatcher(k8sClient, k8sApi, podWatchersMap); // Reinitialize watcher on catch
  }
};

const reinitializeNamespaceWatcher = async (
  k8sClient: k8s.KubeConfig,
  k8sApi: k8s.CoreV1Api,
  podWatchersMap: Map<string, any>
) => {
  logger.info("Retrying in 5 seconds...");
  await sleep(5000);
  try {
    // Fetch the latest resource version from the "default" namespace
    const response = await k8sApi.readNamespace("default"); // this namespace should always exist
    const resourceVersion = response.body.metadata?.resourceVersion ?? "0";

    await namespaceWatcher(k8sClient, resourceVersion, k8sApi, podWatchersMap);
  } catch (error) {
    logger.error(
      `Failed to fetch resourceVersion and reinitialize [namespaces] watcher: ${error}`
    );
  }
};

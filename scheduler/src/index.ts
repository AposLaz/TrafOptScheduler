import { app } from './app';
import { Config } from './config/config';
import { logger } from './config/logger';
import './config/setup';
import { MetricsType } from './k8s/enums';
import { KubernetesManager } from './k8s/manager';
import { PrometheusManager } from './prometheus/manager';
import { singleAndMultipleRsPods } from './services/getSingleAndMultipleRsPods';

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
    // Promise.all([checkNotReadyPodsInQueue()]).then(() => {
    //   logger.info('All Deploys are ready');
    // });
    const k8sManager = new KubernetesManager();
    const promManager = new PrometheusManager();

    for (const namespace of Config.NAMESPACES) {
      try {
        // for each namespace

        // get the graph of deployments and pods
        const deploymentPods =
          await k8sManager.getPodsOfEachDeploymentByNs(namespace);

        if (!deploymentPods) {
          logger.warn(
            `No Deployments/ReplicaSets/Pods found on Namespace: ${namespace}`
          );
          continue;
        }

        const podMetrics = await promManager.getPodThresholds(
          MetricsType.MEMORY,
          namespace
        );

        if (!podMetrics) {
          logger.warn(`No Pod Metrics found on Namespace: ${namespace}`);
          continue;
        }

        const criticalPods = singleAndMultipleRsPods(
          deploymentPods,
          podMetrics.aboveThreshold
        );

        console.log(JSON.stringify(criticalPods, null, 2));

        const nonCriticalPods = singleAndMultipleRsPods(
          deploymentPods,
          podMetrics.belowThreshold
        );

        console.log(JSON.stringify(nonCriticalPods, null, 2));

        // get the metrics of the pods
      } catch (err: unknown) {
        const error = err as Error;
        logger.error(`Error: ${error.message}`);
        continue;
      }
    }
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Could not setup api`);
    throw new Error(err.message);
  }
};

initSetup();

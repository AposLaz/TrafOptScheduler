import { app } from './app';
import { Config } from './config/config';
import { logger } from './config/logger';
import './config/setup';
import { KubernetesManager } from './k8s/manager';
import { PrometheusManager } from './prometheus/manager';
import { autoScalerSingleRs } from './services/autoScalerSingleRs';
// import { singleAndMultipleRsPods } from './services/getSingleAndMultipleRsPods';
import { DUMMY_DATA } from '../tests/data/schedulerDummyData';

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
    // get all cluster nodes and create a mapping for get the latency
    const k8sManager = new KubernetesManager();
    const prometheusManager = new PrometheusManager();

    // map latency with cluster nodes
    const nodesLatency = await k8sManager.getNodesRegionZoneAndLatency();

    for (const namespace of Config.NAMESPACES) {
      try {
        // for each namespace

        // get the graph of deployments and pods
        const [deploymentPods, podMetrics] = await Promise.all([
          await k8sManager.getPodsOfEachDeploymentByNs(namespace),
          await k8sManager.getClassifiedPodsByThreshold(namespace),
        ]);

        if (!deploymentPods) {
          logger.warn(
            `No Deployments/ReplicaSets/Pods found on Namespace: ${namespace}`
          );
          continue;
        }

        if (!podMetrics) {
          logger.warn(`No Pod Metrics found on Namespace: ${namespace}`);
          continue;
        }

        // get single and multiple replica pods that reached the threshold
        const criticalPods = DUMMY_DATA.criticalPods;
        //singleAndMultipleRsPods(deploymentPods,podMetrics.aboveThreshold);

        console.log(JSON.stringify(criticalPods, null, 2));

        // get single and multiple replica pods that did not reach the threshold
        // const nonCriticalPods = singleAndMultipleRsPods(
        //   deploymentPods,
        //   podMetrics.belowThreshold
        // );

        // if (criticalPods.singleRs.length > 0) {
        if (criticalPods.singleRs.length > 0) {
          await autoScalerSingleRs(
            criticalPods.singleRs,
            namespace,
            nodesLatency,
            k8sManager,
            prometheusManager
          );
        }

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

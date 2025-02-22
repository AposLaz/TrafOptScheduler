import { Config } from './config/config';
import { logger } from './config/logger';
import { KubernetesManager } from './k8s/manager';
import { FaultToleranceScheduler } from './optiScaler/services/faultTolerance.service';
import { PrometheusManager } from './prometheus/manager';
import { getPodNodeResources } from './services/getPodNodeResources';
import { DummyNodes, DummyAzTopology } from '../tests/data/dummy/cluster';
import { DummyDeployments } from '../tests/data/dummy/deployments';

/**
 * Setup the entire application
 * 1. Check if all deploys are ready in background
 * 2. Get the kubernetes manager
 * 3. Get the prometheus manager
 * 4. Get the latency of all nodes in the cluster
 * 5. For each namespace in the config
 * 6. Get the deployments in the namespace
 * 7. If no deployments are found, skip this namespace
 * 8. Get the critical deployments (deployments that are above the threshold)
 * 9. If there are deployments that are below the threshold, scale down
 * 10. If there are deployments that are above the threshold, scale up
 * 11. If there are no pod metrics, skip this namespace
 * 12. Get the single and multiple replica pods that reached the threshold
 * 13. Get single and multiple replica pods that did not reach the threshold
 * 14. If there are single replica pods that reached the threshold, run autoScalerSingleRs
 */
export const TrafficScheduler = async () => {
  try {
    // Setup the entire application
    // check if all deploys are ready in background
    // Promise.all([checkNotReadyPodsInQueue()]).then(() => {
    //   logger.info('All Deploys are ready');
    // });

    // Get the kubernetes manager
    const k8sManager = new KubernetesManager();

    // Get the prometheus manager
    const prometheusManager = new PrometheusManager();

    // Get the latency of all nodes in the cluster
    const nodesLatency = await k8sManager.getNodesRegionZoneAndLatency();

    const zonesNodes = await k8sManager.getClusterAzTopology();

    // For each namespace in the config
    for (const namespace of Config.NAMESPACES) {
      try {
        // Get the deployments in the namespace
        const deployments = await k8sManager.getDeploymentsMetrics(namespace);

        // If no deployments are found
        if (!deployments || Object.keys(deployments).length === 0) {
          // Skip this namespace
          continue;
        }

        // Get the critical deployments (deployments that are above the threshold)
        const loadDeployment = k8sManager.getCriticalDeployments(deployments);

        console.log(loadDeployment.lowLoadedDeployments);
        // If there are deployments that are below the threshold
        if (Object.keys(loadDeployment.lowLoadedDeployments).length > 0) {
          const loggerOperation = logger.child({
            operation: 'LowLoadDeployments',
          });

          for (const [deployment, node] of Object.entries(
            loadDeployment.lowLoadedDeployments
          )) {
            const replicaPods = deployments[deployment];

            if (replicaPods.length === 1) {
              loggerOperation.info(
                `Deployment "${deployment}" has a single replica. Scaling down is not possible`
              );
              continue;
            }
            // Get the average usage of all nodes in the deployment
            const sumDeploymentClusterUsage = node.reduce(
              (preUsage, currentUsage) => {
                return preUsage + currentUsage.avgMetric;
              },
              0
            );

            // Calculate the average usage of the deployment
            const avgDeploymentClusterUsage =
              sumDeploymentClusterUsage / node.length;

            // If the average usage is above the threshold
            if (avgDeploymentClusterUsage < Config.metrics.lowerThreshold) {
              // Get the replica pods of the deployment

              // Scale down
              const mostLoadedNodes = await k8sManager.getMostHighLoadedNodes();
              const cnNode = new FaultToleranceScheduler(
                replicaPods,
                mostLoadedNodes,
                zonesNodes
              ).getCandidateNodeToRemove();
            }
          }
        }

        // If there are deployments that are above the threshold
        if (Object.keys(loadDeployment.highLoadedDeployments).length > 0) {
          for (const [deployment, node] of Object.entries(
            loadDeployment.highLoadedDeployments
          )) {
            // Get the average usage of all nodes in the deployment
            const sumDeploymentClusterUsage = node.reduce(
              (preUsage, currentUsage) => {
                return preUsage + currentUsage.avgMetric;
              },
              0
            );

            // Calculate the average usage of the deployment
            const avgDeploymentClusterUsage =
              sumDeploymentClusterUsage / node.length;

            // If the average usage is above the threshold
            if (avgDeploymentClusterUsage > Config.metrics.upperThreshold) {
              // Get the replica pods of the deployment
              const replicaPods = deployments[deployment];

              // get pods usage or requested resources
              const podResources = getPodNodeResources(replicaPods[0]);

              // get all nodes with sufficient resources
              const nodeMetrics = DummyNodes; //await k8sManager.getNodesWithSufficientResources(podResources);

              if (nodeMetrics.length === 0) {
                continue;
              }

              console.log(replicaPods);
              console.log(
                `run optiScaler for Deployment ${deployment} in node ${node}`
              );

              console.log(podResources);
              console.log(nodeMetrics);

              // fault tolerance
              const cnNodes = new FaultToleranceScheduler(
                replicaPods,
                nodeMetrics,
                zonesNodes
              ).getCandidateNodesToAdd();
              console.log(cnNodes);
              continue;
            }

            // For each node
            node.forEach((n) => {
              // If the node is above the threshold
              if (n.avgMetric > Config.metrics.upperThreshold) {
                console.log(
                  `run optiBalancer for Deployment ${deployment} to replica pods in node ${node}`
                );
              }
            });
          }
        }

        // If there are no pod metrics
        // if (!podMetrics) {
        //   logger.warn(`No Pod Metrics found on Namespace: ${namespace}`);
        //   continue;
        // }

        // // Get the single and multiple replica pods that reached the threshold
        // const criticalPods = DUMMY_DATA.criticalPods;
        // //singleAndMultipleRsPods(deploymentPods,podMetrics.aboveThreshold);

        // console.log(JSON.stringify(criticalPods, null, 2));

        // // Get single and multiple replica pods that did not reach the threshold
        // // const nonCriticalPods = singleAndMultipleRsPods(
        // //   deploymentPods,
        // //   podMetrics.belowThreshold
        // // );

        // // if (criticalPods.singleRs.length > 0) {
        // if (criticalPods.singleRs.length > 0) {
        //   await autoScalerSingleRs(
        //     criticalPods.singleRs,
        //     namespace,
        //     nodesLatency,
        //     k8sManager,
        //     prometheusManager
        //   );
        // }
      } catch (err: unknown) {
        // Handle the error
        const error = err as Error;
        logger.error(`Error: ${error.message}`);
        // Skip this namespace
        continue;
      }
    }
  } catch (error: unknown) {
    // Handle the error
    const err = error as Error;
    logger.error(`Could not setup api`);
    throw new Error(err.message);
  }
};

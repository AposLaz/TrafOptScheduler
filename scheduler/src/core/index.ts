import { OptiBalancer } from './optiBalancer';
import { OptiScaler } from './optiScaler';
import { ScaleAction } from './optiScaler/enums';
import { DummyDeployments } from '../../tests/data/dummy/deployments';
import { FileSystemHandler } from '../adapters/filesystem';
import { KubernetesAdapterImpl } from '../adapters/k8s';
import { k8sMapper } from '../adapters/k8s/mapper';
import { PrometheusAdapterImpl } from '../adapters/prometheus';
import { Config } from '../config/config';
import { logger } from '../config/logger';
import { getPodNodeResources } from '../utils';

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
    const k8sAdapter = new KubernetesAdapterImpl();
    // do not block
    k8sAdapter.addLocalityLabels();

    // Get the prometheus manager
    const promAdapter = new PrometheusAdapterImpl();

    const optiBalancer = new OptiBalancer(k8sAdapter, promAdapter, Config.metrics.type);

    const fileSystem = new FileSystemHandler();

    const clusterTopology = await k8sAdapter.getClusterTopology();
    const zonesNodes = k8sMapper.toClusterAzTopology(clusterTopology);

    // Get the latency of all nodes in the cluster
    const nodesLatency = await promAdapter.getNodesLatency();

    if (!nodesLatency) {
      logger.error('No nodes latency found');
      return;
    }

    // For each namespace in the config
    for (const namespace of Config.NAMESPACES) {
      try {
        // Get the deployments in the namespace
        const deployments = DummyDeployments; // await k8sAdapter.getDeploymentsMetrics(namespace);

        // If no deployments are found
        if (!deployments || Object.keys(deployments).length === 0) {
          // Skip this namespace
          continue;
        }

        // Get the critical deployments (deployments that are above the threshold)
        const loadDeployment = k8sAdapter.getCriticalDeployments(deployments);

        console.log(loadDeployment.lowLoadedDeployments);
        // If there are deployments that are below the threshold
        if (Object.keys(loadDeployment.lowLoadedDeployments).length > 0) {
          const loggerOperation = logger.child({
            operation: 'LowLoadDeployments',
          });

          for (const [deployment, node] of Object.entries(loadDeployment.lowLoadedDeployments)) {
            const replicaPods = deployments[deployment];

            if (replicaPods.length === 1) {
              loggerOperation.info(`Deployment "${deployment}" has a single replica. Scaling down is not possible`);
              continue;
            }
            // Get the average usage of all nodes in the deployment
            const sumDeploymentClusterUsage = node.reduce((preUsage, currentUsage) => {
              return preUsage + currentUsage.avgMetric;
            }, 0);

            // Calculate the average usage of the deployment
            const avgDeploymentClusterUsage = sumDeploymentClusterUsage / node.length;

            // If the average usage is above the threshold
            if (avgDeploymentClusterUsage < Config.metrics.lowerThreshold) {
              // Get the replica pods of the deployment

              loggerOperation.info(
                `\n#############################################################################
                \nDeployment "${deployment}" is below the threshold. Scaling down
                \n##############################################################################`
              );
              // get all nodes metrics
              const nodeMetrics = await k8sAdapter.getNodesMetrics();

              // Scale down
              new OptiScaler(
                ScaleAction.DOWN,
                {
                  deployment,
                  namespace,
                  replicaPods,
                  nodeMetrics,
                  zonesNodes,
                  nodesLatency,
                },
                { prom: promAdapter, k8s: k8sAdapter, fileSystem }
              ).Execute(Config.metrics.type, Config.metrics.weights);
            }
          }
        }

        // If there are deployments that are above the threshold
        if (Object.keys(loadDeployment.highLoadedDeployments).length > 0) {
          for (const [deployment, node] of Object.entries(loadDeployment.highLoadedDeployments)) {
            const loggerOperation = logger.child({ operation: 'HighLoadDeployments' });

            // Get the average usage of all nodes in the deployment
            const sumDeploymentClusterUsage = node.reduce((preUsage, currentUsage) => {
              return preUsage + currentUsage.avgMetric;
            }, 0);

            // Calculate the average usage of the deployment
            const avgDeploymentClusterUsage = sumDeploymentClusterUsage / node.length;

            // Get the replica pods of the deployment
            const replicaPods = deployments[deployment];

            // If the average usage is above the threshold
            if (avgDeploymentClusterUsage > Config.metrics.upperThreshold) {
              // get pods usage or requested resources
              const podResources = getPodNodeResources(replicaPods[0]);

              // get all nodes with sufficient resources
              const nodeMetrics = await k8sAdapter.getNodesWithSufficientResources(podResources);

              if (nodeMetrics.length === 0) {
                continue;
              }

              // console.log(replicaPods);
              console.log(`run optiScaler for Deployment ${deployment} in node ${node}`);

              // console.log(podResources);
              // console.log(nodeMetrics);

              loggerOperation.info(
                `\n#############################################################################
                \nDeployment "${deployment}" is above the threshold. Scaling up
                \n##############################################################################`
              );

              // fault tolerance
              // new OptiScaler(
              //   ScaleAction.UP,
              //   {
              //     deployment,
              //     namespace,
              //     replicaPods,
              //     nodeMetrics,
              //     zonesNodes,
              //     nodesLatency,
              //   },
              //   { prom: promAdapter, k8s: k8sAdapter, fileSystem }
              // ).Execute();

              continue;
            }
            loggerOperation.info(
              `\n#############################################################################
                \nDeployment "${deployment}" is above the threshold. Traffic Split
                \n##############################################################################`
            );

            console.log(node);

            // For each node
            // node.forEach((n) => {
            // If the node is above the threshold
            // if (n.avgMetric > Config.metrics.upperThreshold) {
            //   console.log(
            //     `run optiBalancer for Deployment ${deployment} to replica pods in node ${node}`
            //   );
            // }
            const optiBalancerInput = {
              deployment,
              deployMetrics: deployments,
              namespace,
              replicaPods,
              nodesLatency,
              clusterTopology,
            };

            optiBalancer.Execute(optiBalancerInput);

            // });
          }
        }
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

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
import { setup } from '../config/setup';
import { getPodNodeResources } from '../utils';

import type { ClusterTopology } from '../adapters/k8s/types';
import type { NodesLatency } from '../adapters/prometheus/types';
import { DeploymentReplicaPodsMetrics } from '../types';
import { WriteDataType } from '../adapters/filesystem/types';

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

const k8sAdapter = new KubernetesAdapterImpl();
const promAdapter = new PrometheusAdapterImpl();
const fileSystem = new FileSystemHandler();
const optiBalancer = new OptiBalancer(k8sAdapter, promAdapter, Config.metrics.type);

export const TrafficScheduler = async () => {
  try {
    await setup();

    // do not block
    k8sAdapter.addLocalityLabels();

    const clusterTopology = await k8sAdapter.getClusterTopology();
    const zonesNodes = k8sMapper.toClusterAzTopology(clusterTopology);

    // Get the latency of all nodes in the cluster
    const nodesLatency = await promAdapter.getNodesLatency();

    if (!nodesLatency) {
      logger.error('No nodes latency found');
      return;
    }

    applyOptiBalancerForWrittenData(clusterTopology, nodesLatency);

    // For each namespace in the config
    for (const namespace of Config.NAMESPACES) {
      try {
        // Get the deployments in the namespace
        const deployments = await k8sAdapter.getDeploymentsMetrics(namespace); // DummyDeployments;

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
              new OptiScaler(
                ScaleAction.UP,
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

export const applyOptiBalancerForWrittenData = async (
  clusterTopology: ClusterTopology[],
  nodesLatency: NodesLatency[]
) => {
  // read the deployments from the filesystem
  const data = await fileSystem.readData();
  const loggerOperation = logger.child({ operation: 'OptiBalancer on filesystem pods' });

  console.log(data);

  if (data.length === 0) {
    loggerOperation.info(`No data found in the deployment file`);
    return [];
  }

  const downstreamExecuted = new Set<string>();
  const upstreamToDownstreams = new Map<string, WriteDataType[]>();

  // remove the same deployments array if they exist twice
  const uniqueData = Array.from(new Set(data.map((d) => JSON.stringify(d)))).map((str) => JSON.parse(str));
  console.log(uniqueData);

  const promise = uniqueData.map(async (d) => {
    // check if the deployment is healthy
    try {
      const deployHealthy = await k8sAdapter.checkDeploymentHealthy(d.deployment, d.namespace);
      if (deployHealthy instanceof Error) {
        if (deployHealthy.message.includes('not found')) {
          loggerOperation.error(`Deployment "${d.deployment}" on namespace "${d.namespace}" is not found`);
        }

        loggerOperation.error(deployHealthy);

        await fileSystem.deleteData((item) => item.deployment === d.deployment && item.namespace === d.namespace);
        return [];
      }
      if (!deployHealthy) {
        loggerOperation.warn(`Deployment "${d.deployment}" on namespace "${d.namespace}" is not fully running`);
        return [];
      }
    } catch (error: unknown) {
      loggerOperation.error(error);
      return [];
    }

    // get downstream pods
    try {
      const downstream = await promAdapter.getDownstreamPodGraph(d.deployment, d.namespace);

      // If no downstream pods are found, delete the deployment from the filesystem
      if (!downstream) {
        return [];
      }

      console.log(JSON.stringify(downstream, null, 2));

      // get downstream pods namespace
      const dmNamespace = downstream
        .flatMap((dm) => dm.destinations)
        .map((ds) => {
          return {
            deployment: ds.destination_workload,
            namespace: ds.destination_service_namespace,
          };
        });

      // Track upstream -> downstream
      const key = `${d.deployment}|${d.namespace}`;
      upstreamToDownstreams.set(key, dmNamespace);

      return dmNamespace;
    } catch (error: unknown) {
      loggerOperation.error(error);
      return [];
    }
  });

  const dmDeploys = await Promise.all(promise);
  const uniqueDmDeployments = Array.from(new Set(dmDeploys.flat().map((d) => JSON.stringify(d)))).map((str) =>
    JSON.parse(str)
  );
  console.log(uniqueDmDeployments);

  // for each unique namespace
  const uniqueNamespace = Array.from(new Set(uniqueDmDeployments.map((u) => u.namespace)));
  console.log(uniqueNamespace);

  // get deployment metrics
  try {
    const promise = uniqueNamespace.map(async (ns) => {
      const deployments = await k8sAdapter.getDeploymentsMetrics(ns); // DummyDeployments;
      console.log(JSON.stringify(deployments, null, 2));
      // // If no deployments are found
      if (!deployments || Object.keys(deployments).length === 0) {
        // Skip this namespace
        return [];
      }

      return deployments;
    });

    const deploysMetrics = (await Promise.all(promise)).flat();

    const deployments: DeploymentReplicaPodsMetrics = Object.assign({}, ...deploysMetrics);

    // for each downstream deployment apply the rules

    const promiseDeployments = uniqueDmDeployments.map(async (d) => {
      const optiBalancerInput = {
        deployment: d.deployment,
        namespace: d.namespace,
        replicaPods: deployments[d.deployment],
        nodesLatency,
        clusterTopology,
      };

      await optiBalancer.Execute(optiBalancerInput);
    });

    await Promise.all(promiseDeployments);

    uniqueDmDeployments.forEach((d) => {
      const key = `${d.deployment}|${d.namespace}`;
      downstreamExecuted.add(key);
    });

    // Delete upstreams if all their downstreams were executed
    const deletePromises: Promise<void>[] = [];

    for (const [upstreamKey, downstreams] of upstreamToDownstreams.entries()) {
      const allProcessed = downstreams.every((d) => downstreamExecuted.has(`${d.deployment}|${d.namespace}`));

      if (allProcessed) {
        const [deployment, namespace] = upstreamKey.split('|');
        deletePromises.push(
          fileSystem.deleteData((item) => item.deployment === deployment && item.namespace === namespace)
        );
      }
    }

    await Promise.all(deletePromises);
  } catch (error: unknown) {
    loggerOperation.error(error);
    return [];
  }

  return [];
};

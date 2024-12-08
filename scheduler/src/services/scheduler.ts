import { logger } from '../config/logger';
import { KubernetesManager } from '../k8s/manager';
import { DeploymentSingleRs, Resources } from '../types';

export const schedulerSingleRs = async (
  criticalPods: DeploymentSingleRs[],
  k8sManager: KubernetesManager
) => {
  for (const single of criticalPods) {
    console.log(single);
    // get the max of requested or used memory and cpu
    const podRequestedMetrics: Resources = {
      cpu:
        single.pods.usage.cpu > single.pods.requested.cpu
          ? single.pods.usage.cpu
          : single.pods.requested.cpu,
      memory:
        single.pods.usage.memory > single.pods.requested.memory
          ? single.pods.usage.memory
          : single.pods.requested.memory,
    };

    const nodes = await getNodesWithSufficientResources(
      podRequestedMetrics,
      k8sManager
    );

    if (nodes.length === 0) {
      logger.warn(
        `No nodes found with sufficient resources for create a new replica pod for deployment: ${single.deployment}');`
      );
      continue;
    }

    // for this pod get its upstream and downstream deployments
    let candidateNode: string;
  }
};

const getNodesWithSufficientResources = async (
  pod: Resources,
  k8sManager: KubernetesManager
) => {
  const nodes = await k8sManager.getNodesMetrics();
  // find the nodes that the deployment can be create a new replica pod
  const sufficientResources = nodes.filter(
    (node) =>
      pod.cpu <= node.freeToUse.cpu && pod.memory <= node.freeToUse.memory
  );

  return sufficientResources;
};

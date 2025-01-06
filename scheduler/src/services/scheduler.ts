import { logger } from '../config/logger';
import { KubernetesManager } from '../k8s/manager';
import { NodeMetrics } from '../k8s/types';
import { PrometheusManager } from '../prometheus/manager';
import { DeploymentSingleRs, Resources } from '../types';

export const schedulerSingleRs = async (
  criticalPods: DeploymentSingleRs[],
  namespace: string,
  k8sManager: KubernetesManager,
  promManager: PrometheusManager
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
    const upstream = await promManager.getUpstreamPodGraph(
      single.deployment,
      namespace
    );
    // console.log(JSON.stringify(upstream, null, 2));
    // console.log('--------------');
    const downstream = await promManager.getDownstreamPodGraph(
      single.deployment,
      namespace
    );

    // console.log(JSON.stringify(downstream, null, 2));
    candidateNode = getCandidateNodeByLFU(single, nodes);

    // in case that the nodes length > 1 then choose the most suitable candidate node
    if (nodes.length > 1) {
      logger.info(
        `Find the best candidate node for deployment: ${single.deployment}`
      );
      if (
        ((upstream && upstream.length === 0) || !upstream) &&
        ((downstream && downstream.length === 0) || !downstream)
      ) {
        // the pod does not have any upstream or downstream pod, get the candidate node using the LFU
      } else if (downstream && downstream.length === 0) {
        // get the candidate node base of the rps of downstream pods
      } else {
        // get the candidate node base of the rps of the upstream pods
      }
    }

    logger.info(
      `Candidate node for deployment: **${single.deployment}** is: ${candidateNode}`
    );

    // find the nodes that the pod must not be scheduled
    const taintNodes = nodes
      .filter((node) => node.name !== candidateNode)
      .map((node) => node.name);

    // create new replica pod
    await k8sManager.createReplicaPodToSpecificNode(
      single.deployment,
      namespace,
      taintNodes
    );

    logger.info(
      `Created new replica pod for deployment: **${single.deployment}** on node: ${candidateNode}`
    );
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

const getCandidateNode = () => {};

// Least Frequently used by Memory and CPU
const getCandidateNodeByLFU = (
  pod: DeploymentSingleRs,
  nodes: NodeMetrics[]
): string => {
  const sortNodesWeight = nodes
    .map((node) => {
      const normalizedCPU = node.requested.cpu / node.allocatable.cpu;
      const normalizedMemory = node.requested.memory / node.allocatable.memory;

      return {
        name: node.name,
        score: (normalizedCPU + normalizedMemory) / 2,
      };
    })
    .sort((a, b) => a.score - b.score); // select the node with the lowest score

  // if possible remove the node that the pod is already located.
  if (sortNodesWeight.length > 1) {
    const candidateNode = sortNodesWeight.filter(
      (node) => node.name !== pod.pods.node
    );

    return candidateNode[0].name;
  }
  // return the first node
  return sortNodesWeight[0].name;
};

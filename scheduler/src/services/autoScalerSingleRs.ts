import { CN } from './getCandidateNode';
import { logger, loggerOperationInfo } from '../config/logger';

import type { KubernetesManager } from '../k8s/manager';
import type { NodeLatency } from '../k8s/types';
import type { PrometheusManager } from '../prometheus/manager';
import type { DeploymentSingleRs, Resources } from '../types';

export const autoScalerSingleRs = async (
  criticalPods: DeploymentSingleRs[],
  namespace: string,
  nodesLatency: NodeLatency[] | undefined,
  k8sManager: KubernetesManager,
  promManager: PrometheusManager
) => {
  loggerOperationInfo(
    `Running Autoscaler for Critical Pods with a Single Replica pod in Namespace: ${namespace}`
  );

  logger.info(`There are total ${criticalPods.length} critical pods`);

  for (const single of criticalPods) {
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

    // get all nodes with sufficient resources
    const nodes = await k8sManager.getNodesWithSufficientResources(
      podRequestedMetrics
    );

    if (nodes.length === 0) {
      logger.warn(
        `No nodes found with sufficient resources for create a new replica pod for deployment: ${single.deployment}`
      );
      continue;
    }

    // for this pod get its upstream and downstream deployments
    const upstream = await promManager.getUpstreamPodGraph(
      single.deployment,
      namespace
    );

    const downstream = await promManager.getDownstreamPodGraph(
      single.deployment,
      namespace
    );

    // prefer as the candidate node, the node that the critical pod is already running
    // otherwise choose the node with the highest free memory
    const randomCandidateNode = nodes
      .sort((a, b) => a.freeToUse.memory - b.freeToUse.memory)
      .filter((node) => node.name === single.pods.node);

    let candidateNode: string = single.pods.node; // default candidate node

    if (randomCandidateNode.length === 0) {
      candidateNode = nodes[0].name;
    }

    // in case that the nodes length > 1 then choose the most suitable candidate node
    if (nodes.length > 1) {
      logger.info(
        `Find the best candidate node for deployment: ${single.deployment}`
      );

      if (upstream && upstream.length > 0) {
        // get the candidate node base of the rps of the upstream pods
        candidateNode = CN.getCandidateNodeUpstream(
          single,
          upstream,
          nodes,
          nodesLatency
        );
      } else if (downstream && downstream.length > 0) {
        // get the candidate node base of the rps of downstream pods
        candidateNode = CN.getCandidateNodeDownstream(
          single,
          downstream,
          nodes,
          nodesLatency
        );
      } else {
        candidateNode = CN.getCandidateNodeByLFU(single, nodes);
      }
    }

    logger.info(
      `Candidate node for deployment: **${single.deployment}** is: ${candidateNode}`
    );

    /*
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
    );*/
  }
};

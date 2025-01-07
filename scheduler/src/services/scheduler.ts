import { logger } from '../config/logger';
import { KubernetesManager } from '../k8s/manager';
import { NodeLatency, NodeMetrics } from '../k8s/types';
import { PrometheusManager } from '../prometheus/manager';
import { DeploymentGraphRps, GraphDataRps } from '../prometheus/types';
import { DeploymentSingleRs, Resources } from '../types';

export const schedulerSingleRs = async (
  criticalPods: DeploymentSingleRs[],
  namespace: string,
  nodesLatency: NodeLatency[] | undefined,
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
    const upstream = await promManager.getUpstreamPodGraph(
      single.deployment,
      namespace
    );
    const downstream = await promManager.getDownstreamPodGraph(
      single.deployment,
      namespace
    );

    console.log(JSON.stringify(downstream, null, 2));
    console.log('--------------');

    // console.log(JSON.stringify(downstream, null, 2));
    let candidateNode: string = single.pods.node; // default candidate node

    // in case that the nodes length > 1 then choose the most suitable candidate node
    if (nodes.length > 1) {
      logger.info(
        `Find the best candidate node for deployment: ${single.deployment}`
      );

      if (upstream && upstream.length > 0) {
        // get the candidate node base of the rps of the upstream pods
        candidateNode = getCandidateNode(
          single,
          upstream,
          nodesLatency,
          'upstream'
        );
      } else if (downstream && downstream.length > 0) {
        // get the candidate node base of the rps of downstream pods
        candidateNode = getCandidateNode(
          single,
          downstream,
          nodesLatency,
          'downstream'
        );
      } else {
        candidateNode = getCandidateNodeByLFU(single, nodes);
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
    // await k8sManager.createReplicaPodToSpecificNode(
    //   single.deployment,
    //   namespace,
    //   taintNodes
    // );

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

const getCandidateNode = (
  pod: DeploymentSingleRs,
  graph: GraphDataRps[],
  nodesLatency: NodeLatency[] | undefined,
  deployType: 'upstream' | 'downstream'
) => {
  // Get max values per metric for normalization

  // prefer the node with the higher rps
  const perNodeRps = graph.map((node) => {
    return {
      node: node.node,
      rps: node.destinations.reduce((nodeRps, pod) => {
        return nodeRps + pod.rps;
      }, 0),
    };
  });

  const allNodeRps = perNodeRps.reduce((nodeRps, node) => {
    return nodeRps + node.rps;
  }, 0);

  let perNodeLatency: NodeLatency[] = [];
  let allNodesLatency = 0;

  if (nodesLatency) {
    const graphNodes = graph.map((node) => node.node);
    // find the nodes that the upstream and downstream services communicate.
    // ex if upstream is in node eu1 and downstream is in node eu2 then the nodes that communicate are eu1 and eu2 and the latency is eu1 -> eu2
    // prefer the node with the lower latency
    if (deployType === 'upstream') {
      // from all nodes in graph get the latency if they are to
      perNodeLatency = nodesLatency.filter(
        (latency) =>
          latency.to === pod.pods.node && graphNodes.includes(latency.from)
      );
    }
    if (deployType === 'downstream') {
      // from all nodes in graph get the latency if they are from
      perNodeLatency = nodesLatency.filter(
        (latency) =>
          latency.from === pod.pods.node && graphNodes.includes(latency.to)
      );
    }
  }

  if (perNodeLatency.length > 0) {
    allNodesLatency = perNodeLatency.reduce((latency, node) => {
      return latency + node.latency;
    }, 0);
  }

  console.log(perNodeLatency);
  console.log(allNodesLatency);
  // cloud provider latency

  console.log(perNodeRps);
  console.log(allNodeRps);

  const sortNodesWeight = perNodeRps
    .map((node) => {
      const normalizedRps = allNodeRps === 0 ? 0 : node.rps / allNodeRps;
      // latency
      let nodeLatency = 0;

      if (perNodeLatency.length > 0) {
        const nodeLat =
          deployType === 'upstream'
            ? perNodeLatency.find((latency) => latency.from === node.node)
            : perNodeLatency.find((latency) => latency.to === node.node);

        if (nodeLat) {
          nodeLatency = nodeLat.latency;
        }
      }

      console.log('nodeLatency:', nodeLatency);

      const normalizedLatency =
        allNodesLatency === 0 ? 0 : nodeLatency / allNodesLatency;

      console.log('normalizedRps:', normalizedRps);
      console.log('normalizedLatency:', normalizedLatency);
      return {
        name: node.node,
        score: normalizedRps * 0.5 + normalizedLatency * 0.5,
      };
    })
    .sort((a, b) => a.score - b.score); // select the node with the lowest score

  console.log(sortNodesWeight);
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
        score: normalizedCPU * 0.5 + normalizedMemory * 0.5,
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

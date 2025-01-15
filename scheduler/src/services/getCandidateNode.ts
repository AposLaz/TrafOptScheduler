import { logger } from '../config/logger';

import type { NodeLatency, NodeMetrics } from '../k8s/types';
import type { GraphDataRps } from '../prometheus/types';
import type { DeploymentSingleRs } from '../types';

export const CN = {
  // Least Frequently used by Memory and CPU
  getCandidateNodeByLFU(pod: DeploymentSingleRs, nodes: NodeMetrics[]): string {
    const sortNodesWeight = nodes
      .map((node) => {
        const normalizedCPU = node.requested.cpu / node.allocatable.cpu;
        const normalizedMemory =
          node.requested.memory / node.allocatable.memory;

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
  },
  getCandidateNodeWithHighestRps(
    pod: DeploymentSingleRs,
    graph: GraphDataRps[]
  ) {
    const perNodeRps = graph.map((node) => ({
      node: node.node,
      rps: node.destinations.reduce((nodeRps, pod) => nodeRps + pod.rps, 0),
    }));

    const allNodesRps = perNodeRps.reduce(
      (nodeRps, node) => nodeRps + node.rps,
      0
    );

    const sortNodesWeight = perNodeRps
      .map((node) => {
        const normalizedRps = allNodesRps === 0 ? 0 : node.rps / allNodesRps;

        return {
          name: node.node,
          score: normalizedRps * 0.5,
        };
      })
      .sort((a, b) => b.score - a.score); // select the node with the lowest score

    // if possible remove the node that the pod is already located.
    if (sortNodesWeight.length > 1) {
      const candidateNode = sortNodesWeight.filter(
        (node) => node.name !== pod.pods.node
      );

      return candidateNode[0].name;
    }
    // return the first node
    return sortNodesWeight[0].name;
  },
  getCandidateNodeWithLowestLatency(
    podNode: string,
    nodes: NodeMetrics[],
    nodesLatency: NodeLatency[]
  ) {
    // get the pair of nodes with the lowest latency

    // get the node names that the pod can not be scheduled because of insufficient resources

    const notValidNodes = nodesLatency
      .map((pair) => {
        const data = [];

        const from = nodes.find((node) => node.name === pair.from);
        if (!from) data.push(pair.from);

        const to = nodes.find((node) => node.name === pair.to);
        if (!to) data.push(pair.to);

        return data;
      })
      .filter((node) => node.length > 0);

    const notCandidateNodes = [...new Set(notValidNodes.flat())];

    nodesLatency = nodesLatency.sort((a, b) => a.latency - b.latency);

    const candidateNodes = nodesLatency.filter(
      (node) =>
        !notCandidateNodes.includes(node.from) ||
        !notCandidateNodes.includes(node.to)
    );

    if (candidateNodes.length > 1) {
      const cNode = candidateNodes.filter(
        (node) => node.from !== podNode || node.to !== podNode
      );

      console.log(cNode);
      console.log(podNode);
    }

    // console.log(candidateNode);
    // get the nodes from the latency graph

    return 'node';
  },
  getCandidateNodeUpstream(
    pod: DeploymentSingleRs,
    graph: GraphDataRps[],
    nodes: NodeMetrics[],
    nodesLatency: NodeLatency[] | undefined
  ) {
    // Get max values per metric for normalization

    // check if the nodes in graph have sufficient resources
    const graphNodesWithSufficientResources = graph.filter((node) =>
      nodes.some((n) => n.name === node.node)
    );
    // if does not found any nodes with sufficient resources and the latency graph not exists then find the best Node with the LFU
    if (graphNodesWithSufficientResources.length === 0) {
      if (!nodesLatency || nodesLatency.length === 0) {
        logger.info(`[CANDIDATE NODE FUNCTION] => LFU`);
        return this.getCandidateNodeByLFU(pod, nodes);
      }

      logger.info(
        `[CANDIDATE NODE FUNCTION] => Lowest Latency Among pod Node and other Nodes`
      );
      return this.getCandidateNodeWithLowestLatency(
        pod.pods.node,
        nodes,
        nodesLatency
      );
    }

    // if exists nodes with sufficient resources but no latency exists between the nodes
    if (!nodesLatency || nodesLatency.length === 0) {
      logger.info(`[CANDIDATE NODE FUNCTION] => Node with Highest Rps`);
      return this.getCandidateNodeWithHighestRps(
        pod,
        graphNodesWithSufficientResources
      );
    }

    const perNodeRps = graphNodesWithSufficientResources.map((node) => ({
      node: node.node,
      rps: node.destinations.reduce((nodeRps, pod) => nodeRps + pod.rps, 0),
    }));

    const allNodesRps = perNodeRps.reduce(
      (nodeRps, node) => nodeRps + node.rps,
      0
    );

    let perNodeLatency: NodeLatency[] = [];
    let allNodesLatency = 0;

    // prefer the node with the lower latency
    if (nodesLatency && nodesLatency.length > 0) {
      const graphNodes = graph.map((node) => node.node);
      // find the nodes that the upstream and downstream services communicate.
      // ex if upstream is in node eu1 and downstream is in node eu2 then the nodes that communicate are eu1 and eu2 and the latency is eu1 -> eu2
      // prefer the node with the lower latency
      // from all nodes in graph get the latency if they are to
      perNodeLatency = nodesLatency.filter(
        (latency) =>
          latency.to === pod.pods.node && graphNodes.includes(latency.from)
      );
    }

    // if latency data exists then calculate the normalized latency for all nodes
    if (perNodeLatency.length > 0) {
      allNodesLatency = perNodeLatency.reduce(
        (latency, node) => latency + node.latency,
        0
      );
    }

    const sortNodesWeight = perNodeRps
      .map((node) => {
        const normalizedRps = allNodesRps === 0 ? 0 : node.rps / allNodesRps;
        // latency
        let nodeLatency = 0;

        if (perNodeLatency.length > 0) {
          // find the latency where the node is the from, because the downstream is the current critical pod
          const nodeLat = perNodeLatency.find(
            (latency) => latency.from === node.node
          );

          if (nodeLat) {
            // get the latency
            nodeLatency = nodeLat.latency;
          }
          // if no latency is found for upstream and downstream pods
          if (!nodeLat) {
          }
        }

        const normalizedLatency =
          allNodesLatency === 0 ? 0 : nodeLatency / allNodesLatency;

        return {
          name: node.node,
          score: normalizedRps * 0.5 + normalizedLatency * 0.5,
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
  },

  getCandidateNodeDownstream(
    pod: DeploymentSingleRs,
    graph: GraphDataRps[],
    nodes: NodeMetrics[],
    nodesLatency: NodeLatency[] | undefined
  ) {
    // Get max values per metric for normalization

    // check if the nodes in graph have sufficient resources
    const graphNodeWithSufficientResources = graph.filter((node) =>
      nodes.some((n) => n.name === node.node)
    );

    // if exists nodes with sufficient resources then get them
    if (graphNodeWithSufficientResources.length > 0) {
    }

    // if exists nodes with sufficient resources then get them

    // else check if exists latency nodes and get the nodes with the lower latency
    const perNodeRps = graph.map((node) => ({
      node: node.node,
      rps: node.destinations.reduce((nodeRps, pod) => nodeRps + pod.rps, 0),
    }));

    const allNodeRps = perNodeRps.reduce(
      (nodeRps, node) => nodeRps + node.rps,
      0
    );

    let perNodeLatency: NodeLatency[] = [];
    let allNodesLatency = 0;

    // prefer the node with the lower latency
    if (nodesLatency && nodesLatency.length > 0) {
      const graphNodes = graph.map((node) => node.node);
      // find the nodes that the upstream and downstream services communicate.
      // ex if upstream is in node eu1 and downstream is in node eu2 then the nodes that communicate are eu1 and eu2 and the latency is eu1 -> eu2
      // prefer the node with the lower latency
      // from all nodes in graph get the latency if they are from
      perNodeLatency = nodesLatency.filter(
        (latency) =>
          latency.from === pod.pods.node && graphNodes.includes(latency.to)
      );
    }

    // if latency data exists then calculate the normalized latency for all nodes
    if (perNodeLatency.length > 0) {
      allNodesLatency = perNodeLatency.reduce(
        (latency, node) => latency + node.latency,
        0
      );
    }

    const sortNodesWeight = perNodeRps
      .map((node) => {
        const normalizedRps = allNodeRps === 0 ? 0 : node.rps / allNodeRps;
        // latency
        let nodeLatency = 0;

        if (perNodeLatency.length > 0) {
          // find the latency where the node is the to, because the upstream is the current critical pod

          const nodeLat = perNodeLatency.find(
            (latency) => latency.to === node.node
          );

          if (nodeLat) {
            // get the latency
            nodeLatency = nodeLat.latency;
          }
          // if no latency is found for upstream and downstream pods
          if (!nodeLat) {
          }
        }

        const normalizedLatency =
          allNodesLatency === 0 ? 0 : nodeLatency / allNodesLatency;

        return {
          name: node.node,
          score: normalizedRps * 0.5 + normalizedLatency * 0.5,
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
  },
};

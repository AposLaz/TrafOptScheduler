import * as cnf from './candidateNodes/exports';
import { logger } from '../config/logger';

import type { NodeLatency, NodeMetrics } from '../k8s/types';
import type { GraphDataRps } from '../prometheus/types';
import type { DeploymentSingleRs } from '../types';

// TODO: learn how it works
const loggerOperation = logger.child({ operation: 'getCandidateNode' });

export const CN = {
  utils: cnf.cnUtils,
  // Least Frequently used by Memory and CPU
  candidateNodeByLFU: cnf.getCandidateNodeByLFU,
  candidateNodeByLatency: cnf.getCandidateNodeByLatency,
  candidateNodeByRps: cnf.getCandidateNodeByRps,
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
        loggerOperation.info(`node by LFU`);
        return this.candidateNodeByLFU(pod, nodes);
      }

      loggerOperation.info(
        `node by Lowest Latency Among node with highest rps Node and other Nodes`
      );
      return this.candidateNodeByLatency(
        pod.pods.node,
        graph,
        nodes,
        nodesLatency
      );
    }

    // if exists nodes with sufficient resources but no latency exists between the nodes
    if (!nodesLatency || nodesLatency.length === 0) {
      loggerOperation.info(`Node with Highest Rps`);
      return this.candidateNodeByRps(pod, graphNodesWithSufficientResources);
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

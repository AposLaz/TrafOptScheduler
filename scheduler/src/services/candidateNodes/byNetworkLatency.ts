import { cnUtils } from './utils';

import type { NodeLatency, NodeMetrics } from '../../k8s/types';
import type { GraphDataRps } from '../../prometheus/types';

export const getCandidateNodeByLatency = (
  podNode: string,
  graph: GraphDataRps[],
  nodesWithResources: NodeMetrics[],
  nodesLatency: NodeLatency[]
) => {
  // Get the rps per node
  const perNodeRps = cnUtils.nodeSumRps(graph).sort((a, b) => b.rps - a.rps);

  // Get the nodes latency from each perNodeRps node
  const nodesLatencyFromPerNode = perNodeRps
    .map((node) => {
      return nodesLatency
        .filter((n) => n.from === node.node)
        .sort((a, b) => a.latency - b.latency);
    })
    .flat();

  // get the node names that the pod can not be scheduled because of insufficient resources
  const candidateNodes = nodesLatencyFromPerNode
    .map((pair) => {
      if (nodesWithResources.find((node) => node.name === pair.to)) {
        return pair;
      }
      return undefined;
    })
    .filter((node) => node !== undefined);

  if (candidateNodes.length > 1) {
    // if possible remove the node that the pod is already located.
    const cNode = candidateNodes.filter((node) => node.to !== podNode);

    if (cNode.length > 0) {
      return cNode[0].to;
    }
  }

  return candidateNodes[0].to;
};

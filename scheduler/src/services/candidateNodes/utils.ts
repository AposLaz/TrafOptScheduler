import type { GraphDataRps } from '../../prometheus/types';
import type { NodeRps, NodeWeight } from '../../types';

export const cnUtils = {
  nodeSumRps: (graph: GraphDataRps[]): NodeRps[] => {
    return graph.map((node) => ({
      node: node.node,
      rps: node.destinations.reduce((nodeRps, pod) => nodeRps + pod.rps, 0),
    }));
  },
  normalizedWeightNodesByRps: (
    perNodeRps: NodeRps[],
    totalRps: number
  ): NodeWeight[] => {
    return perNodeRps
      .map((node) => {
        const normalizedRps = totalRps === 0 ? 0 : node.rps / totalRps;

        return {
          name: node.node,
          score: normalizedRps * 0.5,
        };
      })
      .sort((a, b) => b.score - a.score);
  },
  removeNodeForCriticalPod: (
    weights: NodeWeight[],
    crPodName: string
  ): string => {
    // TODO check for other replica pods for this node
    if (weights.length > 1) {
      return weights.filter((node) => node.name !== crPodName)[0].name;
    }

    return weights[0].name;
  },
};

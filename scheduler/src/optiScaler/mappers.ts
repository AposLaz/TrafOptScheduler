import { Config } from '../config/config';

import type { FaultNodesReplicas, FaultZonesNodes } from './types';
import type { ClusterAzTopology, NodeMetrics } from '../k8s/types';

export const OptiScalerMapper = {
  toLFUNodes: (nodes: NodeMetrics[]): NodeMetrics[] => {
    const type = Config.metrics.type;
    const weights = Config.metrics.weights;

    return nodes.sort((a, b) => {
      if (type === 'cpu') {
        return a.requested.cpu - b.requested.cpu;
      } else if (type === 'memory') {
        return a.requested.memory - b.requested.memory;
      } else {
        const aCpuUtil = a.requested.cpu / a.allocatable.cpu || 0;
        const bCpuUtil = b.requested.cpu / b.allocatable.cpu || 0;

        const aMemUtil = a.requested.memory / a.allocatable.memory || 0;
        const bMemUtil = b.requested.memory / b.allocatable.memory || 0;

        const aWeightedUtil = aCpuUtil * weights.CPU + aMemUtil * weights.CPU;
        const bWeightedUtil =
          bCpuUtil * weights.Memory + bMemUtil * weights.Memory;

        // Sort descending (highest load first)
        return aWeightedUtil - bWeightedUtil;
      }
    });
  },
};

export const FaultMapper = {
  toMostHighLoadedNodes: (nodes: NodeMetrics[]): NodeMetrics[] => {
    const type = Config.metrics.type;
    const weights = Config.metrics.weights;

    return nodes.sort((a, b) => {
      if (type === 'cpu') {
        return b.requested.cpu - a.requested.cpu;
      } else if (type === 'memory') {
        return b.requested.memory - a.requested.memory;
      } else {
        const aCpuUtil = a.requested.cpu / a.allocatable.cpu || 0;
        const bCpuUtil = b.requested.cpu / b.allocatable.cpu || 0;

        const aMemUtil = a.requested.memory / a.allocatable.memory || 0;
        const bMemUtil = b.requested.memory / b.allocatable.memory || 0;

        const aWeightedUtil = aCpuUtil * weights.CPU + aMemUtil * weights.CPU;
        const bWeightedUtil =
          bCpuUtil * weights.Memory + bMemUtil * weights.Memory;

        // Sort descending (highest load first)
        return bWeightedUtil - aWeightedUtil;
      }
    });
  },

  toNodesReplicas: (nodes: Record<string, number>): FaultNodesReplicas[] => {
    return Object.entries(nodes).map(([node, replicas]) => ({
      node,
      replicas,
    }));
  },
  toZoneReplicas: (zones: ClusterAzTopology, nodes: FaultNodesReplicas[]) => {
    const zonesNodes: FaultZonesNodes = new Map();

    Object.entries(zones).forEach(([zone, nodesInZone]) => {
      const nodesWithRs = nodes.filter((n) =>
        nodesInZone.nodes.includes(n.node)
      );

      const noNodesRs = nodesInZone.nodes.filter(
        (n) => !nodesWithRs.find((node) => node.node === n)
      );

      const noNodesRsTransform = noNodesRs.map((n) => ({ node: n }));

      zonesNodes.set(zone, {
        nodes: [...nodesWithRs, ...noNodesRsTransform],
        replicas: nodesWithRs.reduce((acc, n) => acc + (n.replicas || 0), 0),
      });
    });

    return zonesNodes;
  },
};

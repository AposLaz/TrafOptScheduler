import type { FaultNodesReplicas, FaultZonesNodes } from './types';
import type { ClusterAzTopology } from '../k8s/types';

export const FaultMapper = {
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

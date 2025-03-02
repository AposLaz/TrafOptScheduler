import type { ClusterAzTopology, NodeMetrics, PodMetrics } from '../k8s/types';
import type { NodesLatency } from '../prometheus/types';

export type FaultToleranceType = {
  deployment: string;
  namespace: string;
  replicaPods: PodMetrics[];
  nodeMetrics: NodeMetrics[];
  zonesNodes: ClusterAzTopology;
};

export type OptiScalerType = FaultToleranceType & {
  nodesLatency: NodesLatency[];
};

export type FaultNodesReplicas = {
  node: string;
  replicas?: number;
};

export type FaultNodesSumReplicas = {
  replicas: number;
  nodes: FaultNodesReplicas[];
};

export type FaultZonesNodes = Map<string, FaultNodesSumReplicas>;

export type CandidateWeights = {
  from: string;
  to: string;
  weight: number;
};

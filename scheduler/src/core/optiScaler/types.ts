import type { FileSystemHandler } from '../../adapters/filesystem';
import type { KubernetesAdapterImpl } from '../../adapters/k8s';
import type { ClusterAzTopology, NodeMetrics, PodMetrics } from '../../adapters/k8s/types';
import type { PrometheusAdapterImpl } from '../../adapters/prometheus';
import type { NodesLatency } from '../../adapters/prometheus/types';

export type FaultToleranceType = {
  deployment: string;
  replicaPods: PodMetrics[];
  nodeMetrics: NodeMetrics[];
  zonesNodes: ClusterAzTopology;
};

export type OptiScalerHandlers = {
  prom: PrometheusAdapterImpl;
  k8s: KubernetesAdapterImpl;
  fileSystem: FileSystemHandler;
};

export type OptiScalerType = FaultToleranceType & {
  namespace: string;
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

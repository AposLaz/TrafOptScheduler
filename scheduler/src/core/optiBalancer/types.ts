import type { PodMetrics } from '../../adapters/k8s/types';
import type { NodesLatency } from '../../adapters/prometheus/types';
import type { DeploymentReplicaPodsMetrics } from '../../types';

export type OptiScalerType = {
  deployment: string;
  deployMetrics: DeploymentReplicaPodsMetrics;
  namespace: string;
  replicaPods: PodMetrics[];
  nodesLatency: NodesLatency[];
};

export type FromToNode = { from: string; to: string };

export type TrafficWeights = FromToNode & {
  weight: number;
};

export type NormalizedTraffic = FromToNode & {
  normalizedTraffic: number;
};

export type DistributedPercentTraffic = FromToNode & {
  percentage: number;
};

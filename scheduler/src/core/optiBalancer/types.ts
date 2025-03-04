import type { ClusterTopology, PodMetrics } from '../../adapters/k8s/types';
import type { NodesLatency } from '../../adapters/prometheus/types';
import type { DeploymentReplicaPodsMetrics } from '../../types';

export type OptiScalerType = {
  deployment: string;
  deployMetrics: DeploymentReplicaPodsMetrics;
  namespace: string;
  replicaPods: PodMetrics[];
  nodesLatency: NodesLatency[];
  clusterTopology: ClusterTopology[];
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

export type DestinationRule = {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace: string;
  };
  spec: {
    host: string;
    trafficPolicy: {
      loadBalancer: {
        localityLbSetting: {
          enabled: boolean;
          distribute: {
            from: string;
            to: {
              [k: string]: number;
            };
          }[];
        };
      };
      outlierDetection: {
        consecutive5xxErrors: number;
        interval: string;
        baseEjectionTime: string;
        maxEjectionPercent: number;
      };
    };
  };
};

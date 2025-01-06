import type { MetricsType } from './enums';

/*********************************** TAINT TYPES */

export type ReplicasAction = 'add' | 'delete';

export type DeploymentPlacementModel = {
  deploymentName: string;
  nodes: string[]; // taint these nodes
  namespace: string;
  deletePod: string;
};

export type DeploymentNotReadyFilesystem = Omit<
  DeploymentPlacementModel,
  'nodes'
>;

/******************** METRICS TYPES **************** */

export type ConfigMetrics = {
  threshold: number;
  type: MetricsType;
};

export type PodResourceUsageType = {
  aboveThreshold: PodMetrics[];
  belowThreshold: PodMetrics[];
};

export type DeploymentPodMapType = {
  pod: string;
  node: string;
};

// CPU to millicores, Memory to MB
export type Resources = {
  cpu: number;
  memory: number;
};

export type PodMetrics = {
  node: string;
  podName: string;
  usage: Resources;
  percentUsage: Resources & {
    cpuAndMemory: number;
  };
  requested: Resources;
  limits: Resources;
};

export type NodeMetrics = {
  name: string;
  capacity: Resources;
  allocatable: Resources;
  requested: Resources;
  limits: Resources;
  freeToUse: Resources;
};

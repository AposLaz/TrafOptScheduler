import type { MetricsType } from './enums';

/******************** METRICS TYPES **************** */

export type ConfigMetrics = {
  threshold: number;
  type: MetricsType;
};

export type ThresholdPodsEvaluationResult = {
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
  namespace: string;
  node: string;
  podName: string;
  usage: Resources;
  requested: Resources;
  limits: Resources;
};

export type NodeMetrics = {
  name: string;
  capacity: Resources;
  allocatable: Resources;
  requested: Resources;
  limits: Resources;
};

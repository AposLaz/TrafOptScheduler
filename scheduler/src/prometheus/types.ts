export type Pod = {
  pod: string;
  namespace: string;
  instance?: string;
  node?: string;
} & Partial<Omit<DeploymentGraph, 'pod' | 'node'>>;

export type PrometheusResults = {
  metric: Pod;
  value: [number, string];
};
export interface PrometheusData {
  resultType: string;
  result: PrometheusResults[];
}

export type PrometheusResponseType = {
  status: string;
  data: PrometheusData;
};

export type PodResourceUsageType = {
  namespace: string;
  podName: string;
  metric: number;
};

export type DeploymentGraph = {
  node: string;
  pod: string;
  source_workload: string;
  source_version: string;
  source_workload_namespace: string;
  destination_service_name: string;
  destination_service_namespace: string;
  destination_version: string;
  destination_workload: string;
};

/************************************************* PROMETHEUS TYPES */
export type PrometheusResults = {
  metric: PodRps;
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

/******************************************** PROMETHEUS RPS */
export type PodRps = {
  pod: string;
  namespace: string;
  instance?: string;
  node?: string;
} & Partial<Omit<DeploymentGraphRps, 'pod' | 'node'>>;

export type DeploymentGraphRps = {
  rps: number;
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

export type GraphDataRps = {
  node: string;
  destinations: DeploymentGraphRps[];
};

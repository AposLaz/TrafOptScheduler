export type Pod = {
  pod: string;
  namespace: string;
  instance?: string;
  node?: string;
};

export type PrometheusResults = {
  metric: Pod;
  value: [number, string];
};
export interface PrometheusData {
  resultType: string;
  result: PrometheusResults[];
}

export type PrometheusResourcesMetricType = {
  status: string;
  data: PrometheusData;
};

export type PodResourceUsageType = {
  namespace: string;
  podName: string;
  metric: number;
};

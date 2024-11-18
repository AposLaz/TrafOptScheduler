export type Pod = {
  pod: string;
  namespace?: string;
  instance?: string;
  node?: string;
};

export type PrometheusResults = {
  metric: Pod;
  value: [number, string];
};

export type PrometheusTransformResults = Pod & {
  metric: number;
};

export type PrometheusTransformResultsByNode = {
  pod: string;
  node: string;
  metric: number;
};

export type PrometheusTransformResultsToNode = Omit<
  PrometheusTransformResultsByNode,
  'pod'
>;

export interface PrometheusData {
  resultType: string;
  result: PrometheusResults[];
}

export type PrometheusFetchData_POD_CPU_MEMORY = {
  status: string;
  data: PrometheusData;
};

export type PrometheusFetchData_NODE_CPU_MEMORY = {
  status: string;
  data: {
    resultType: string;
    result: {
      metric: {
        node?: string;
        instance?: string;
      };
      value: [number, string];
    }[];
  };
};

export type PrometheusFetchData_ISTIO_METRICS = {
  status: string;
  data: {
    resultType: string;
    result: {
      metric: {
        node: string;
        source_workload: string;
        destination_workload: string;
        pod: string;
      };
      value: [number, string];
    }[];
  };
};

export type PrometheusTransformResultsToIstioMetrics = {
  node: string;
  source: string;
  target: string;
  replicaPod: string;
  metric: number;
};

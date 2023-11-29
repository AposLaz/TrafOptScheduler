export interface Pod {
  pod: string;
}

export interface PrometheusResults {
  metric: Pod;
  value: [number, string];
}

export interface PrometheusTransformResults extends Pod {
  metric: number;
}

export interface PrometheusData {
  resultType: string;
  result: PrometheusResults[];
}

export interface PrometheusFetchData_CPU_RAM {
  status: string;
  data: PrometheusData;
}

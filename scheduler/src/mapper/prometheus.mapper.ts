import type {
  PrometheusFetchData_Istio_Metrics,
  PrometheusTransformResultsToIstioMetrics,
} from '../types';

const prometheusMapper = {
  toIstioMetrics: (
    results: PrometheusFetchData_Istio_Metrics
  ): PrometheusTransformResultsToIstioMetrics[] => {
    return results.data.result.map((data) => ({
      node: data.metric.node,
      source: data.metric.source_workload,
      target: data.metric.destination_workload,
      replicaPod: data.metric.pod,
      metric: parseFloat(Number(data.value[1]).toFixed(2)),
    }));
  },
};

export { prometheusMapper };

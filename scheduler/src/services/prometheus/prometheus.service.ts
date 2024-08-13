import {
  PrometheusFetchData_Istio_Metrics,
  PrometheusTransformResultsToIstioMetrics,
} from '../../types';

export const transformPrometheusSchemaToIstioMetrics = (
  results: PrometheusFetchData_Istio_Metrics
): PrometheusTransformResultsToIstioMetrics[] => {
  const returnResults: PrometheusTransformResultsToIstioMetrics[] = [];

  results.data.result.forEach((data) => {
    const returnObject: PrometheusTransformResultsToIstioMetrics = {
      node: data.metric.node,
      source: data.metric.source_workload,
      target: data.metric.destination_workload,
      replicaPod: data.metric.pod,
      metric: parseFloat(Number(data.value[1]).toFixed(2)),
    };
    returnResults.push(returnObject);
  });

  return returnResults;
};

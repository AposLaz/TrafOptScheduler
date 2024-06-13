import {
  PrometheusFetchData_ISTIO_METRICS,
  PrometheusFetchData_NODE_CPU_MEMORY,
  PrometheusResults,
  PrometheusTransformResults,
  PrometheusTransformResultsByNode,
  PrometheusTransformResultsToIstioMetrics,
  PrometheusTransformResultsToNode,
} from './types';

export function transformPrometheusSchemaToPodMetric(
  results: PrometheusResults[]
): PrometheusTransformResults[] {
  const returnResults: PrometheusTransformResults[] = [];

  results.forEach((data) => {
    const returnObject: PrometheusTransformResults = {
      pod: data.metric.pod,
      metric: parseFloat(Number(data.value[1]).toFixed(2)),
    };
    returnResults.push(returnObject);
  });

  return returnResults;
}

/**
 *
 * @param results
 * @returns
 */
export function transformPrometheusSchemaToPodMetricByNode(
  results: PrometheusResults[]
): PrometheusTransformResultsByNode[] {
  const returnResults: PrometheusTransformResultsByNode[] = [];

  results.forEach((data) => {
    const returnObject: PrometheusTransformResultsByNode = {
      pod: data.metric.pod,
      node: data.metric.instance
        ? data.metric.instance
        : (data.metric.node as string), // ever exists a node
      metric: parseFloat(Number(data.value[1]).toFixed(2)),
    };
    returnResults.push(returnObject);
  });

  return returnResults;
}

/**
 *
 * @param results
 * @returns
 */
export function transformPrometheusSchemaToNodeMetric(
  results: PrometheusFetchData_NODE_CPU_MEMORY
): PrometheusTransformResultsToNode[] {
  const returnResults: PrometheusTransformResultsToNode[] = [];

  results.data.result.forEach((data) => {
    const returnObject: PrometheusTransformResultsToNode = {
      node: data.metric.node, // ever exists a node
      metric: parseFloat(Number(data.value[1]).toFixed(2)),
    };
    returnResults.push(returnObject);
  });

  return returnResults;
}

export function transformPrometheusSchemaToIstioMetrics(
  results: PrometheusFetchData_ISTIO_METRICS
): PrometheusTransformResultsToIstioMetrics[] {
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
}

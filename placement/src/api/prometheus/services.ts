import {
  PrometheusFetchData_ISTIO_METRICS,
  PrometheusFetchData_NODE_CPU_MEMORY,
  PrometheusResults,
  PrometheusTransformResults,
  PrometheusTransformResultsByNode,
  PrometheusTransformResultsToIstioMetrics,
  PrometheusTransformResultsToNode,
} from './types';

/**
 * This function transforms the Prometheus data schema into a more consumable shape.
 * It takes in an array of PrometheusResults and returns an array of PrometheusTransformResults.
 *
 * @param {PrometheusResults[]} results - The array of Prometheus data to transform.
 * @returns {PrometheusTransformResults[]} - The transformed array of Prometheus data.
 */
export function transformPrometheusSchemaToPodMetric(
  results: PrometheusResults[]
): PrometheusTransformResults[] {
  // Initialize an empty array to store the transformed data.
  const returnResults: PrometheusTransformResults[] = [];

  // Iterate over each element in the input array.
  results.forEach((data) => {
    // Create a new object with the transformed data.
    const returnObject: PrometheusTransformResults = {
      // Set the 'pod' field to the value of 'pod' from the input data.
      pod: data.metric.pod,
      // Set the 'metric' field to the second value in the 'value' array of the input data.
      // The value is rounded to two decimal places using parseFloat and toFixed.
      metric: parseFloat(Number(data.value[1]).toFixed(2)),
    };
    // Push the transformed object into the returnResults array.
    returnResults.push(returnObject);
  });

  // Return the transformed array of Prometheus data.
  return returnResults;
}

/**
 * This function transforms the Prometheus data schema into a more consumable shape
 * specific to the pod metrics by node.
 *
 * @param results - The array of Prometheus data to transform.
 * @returns - The transformed array of Prometheus data for pod metrics by node.
 */
export function transformPrometheusSchemaToPodMetricByNode(
  results: PrometheusResults[]
): PrometheusTransformResultsByNode[] {
  // Initialize an empty array to store the transformed data.
  const returnResults: PrometheusTransformResultsByNode[] = [];

  // Iterate over each element in the input array.
  results.forEach((data) => {
    // Create a new object with the transformed data.
    const returnObject: PrometheusTransformResultsByNode = {
      // Set the 'pod' field to the value of 'pod' from the input data.
      pod: data.metric.pod,
      // Set the 'node' field to the value of 'instance' from the input data if it exists.
      // Otherwise, set it to the value of 'node' from the input data.
      node: data.metric.instance
        ? data.metric.instance
        : (data.metric.node as string),
      // Set the 'metric' field to the second value in the 'value' array of the input data.
      // The value is rounded to two decimal places using parseFloat and toFixed.
      metric: parseFloat(Number(data.value[1]).toFixed(2)),
    };
    // Push the transformed object into the returnResults array.
    returnResults.push(returnObject);
  });

  // Return the transformed array of Prometheus data for pod metrics by node.
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

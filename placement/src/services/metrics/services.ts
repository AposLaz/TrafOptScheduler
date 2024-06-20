import { PrometheusTransformResultsToIstioMetrics } from '../../api/prometheus/types';

/**
 * This function removes duplicate zero values from an array of Istio metrics.
 * Duplicate zero values occur when two or more metrics have the same source, target, and replicaPod values,
 * but their metric values are all zero.
 *
 * @param {PrometheusTransformResultsToIstioMetrics[]} dataMetrics - An array of Istio metrics.
 * @returns {PrometheusTransformResultsToIstioMetrics[]} - An array of Istio metrics with duplicate zero values removed.
 */
export const removeDuplicateZeroValues = (
  dataMetrics: PrometheusTransformResultsToIstioMetrics[]
) => {
  return dataMetrics.filter(
    (entry, index, self) =>
      entry.metric !== 0 ||
      self.findIndex(
        (e) =>
          e.source === entry.source &&
          e.target === entry.target &&
          e.replicaPod === entry.replicaPod &&
          e.metric !== 0
      ) === -1
  );
};

import { PrometheusTransformResultsToIstioMetrics } from '../../api/prometheus/types';

// Utility function to remove duplicate zero values from istio metrics
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

import { Config } from '../config/config';

import type { PodResourceUsageType, PrometheusResults } from './types';

export const PrometheusMapper = {
  toPodResourceUsage: (
    results: PrometheusResults[]
  ): PodResourceUsageType[] => {
    // Initialize an empty array to store the transformed data.
    const returnResults: PodResourceUsageType[] = [];

    results.forEach((data) => {
      const returnObject: PodResourceUsageType = {
        namespace: data.metric.namespace,
        podName: data.metric.pod,
        metric: Number(data.value[1]),
      };
      returnResults.push(returnObject);
    });

    return returnResults;
  },
  toUpperLowerLimitPods: (pods: PodResourceUsageType[]) => {
    const aboveThreshold = pods.filter(
      (pod) => pod.metric >= Config.metrics.threshold
    );

    const belowThreshold = pods.filter(
      (pod) => pod.metric < Config.metrics.threshold
    );

    return {
      aboveThreshold,
      belowThreshold,
    };
  },
};

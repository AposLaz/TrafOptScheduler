import { Config } from '../config/config';

import type {
  DeploymentGraph,
  PodResourceUsageType,
  PrometheusResults,
} from './types';

export const PrometheusMapper = {
  toDownstreamDeploymentGraphData: (
    results: PrometheusResults[],
    namespace: string
  ) => {
    // Initialize an empty array to store the transformed data.
    const mapGraph = new Map<string, DeploymentGraph[]>();
    results.forEach((data) => {
      const addData: DeploymentGraph = {
        node: data.metric.node ?? 'unknown',
        pod: data.metric.pod ?? 'unknown',
        source_workload: data.metric.source_workload ?? 'unknown',
        source_version: data.metric.source_version ?? 'unknown',
        source_workload_namespace: namespace,
        destination_service_name:
          data.metric.destination_service_name ?? 'unknown',
        destination_service_namespace:
          data.metric.destination_service_namespace ?? 'unknown',
        destination_version: data.metric.destination_version ?? 'unknown',
        destination_workload: data.metric.destination_workload ?? 'unknown',
      };

      if (mapGraph.has(data.metric.source_workload as string)) {
        mapGraph.get(data.metric.source_workload as string)?.push(addData);
      } else {
        mapGraph.set(data.metric.source_workload as string, [addData]);
      }
    });
    // Convert the Map to an array of objects for easier consumption
    return Array.from(mapGraph.entries()).map(([source, destinations]) => ({
      source,
      destinations,
    }));
  },
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

import { Config } from '../config/config';

import type {
  DeploymentGraphRps,
  GraphDataRps,
  PodResourceUsageType,
  PrometheusResults,
} from './types';

export const PrometheusMapper = {
  toDeploymentGraphDataRpsPerNode: (
    results: PrometheusResults[],
    namespace: string
  ): GraphDataRps[] => {
    // Initialize an empty array to store the transformed data.
    const mapGraph = new Map<string, DeploymentGraphRps[]>();
    results.forEach((data) => {
      const addData: DeploymentGraphRps = {
        rps: Number(data.value[1]),
        node: data.metric.node ?? 'unknown',
        pod: data.metric.pod ?? 'unknown',
        source_workload: data.metric.source_workload ?? 'unknown',
        source_version: data.metric.source_version ?? 'unknown', // the version is the node of the source
        source_workload_namespace: namespace,
        destination_service_name:
          data.metric.destination_service_name ?? 'unknown',
        destination_service_namespace:
          data.metric.destination_service_namespace ?? 'unknown',
        destination_version: data.metric.destination_version ?? 'unknown',
        destination_workload: data.metric.destination_workload ?? 'unknown',
      };

      if (mapGraph.has(data.metric.node ?? 'unknown')) {
        mapGraph.get(data.metric.node ?? 'unknown')?.push(addData);
      } else {
        mapGraph.set(data.metric.node ?? 'unknown', [addData]);
      }
    });
    // Convert the Map to an array of objects for easier consumption
    return Array.from(mapGraph.entries()).map(([node, destinations]) => ({
      node,
      destinations,
    }));
  },
  // toUpstreamDeploymentGraphDataRps: (
  //   results: PrometheusResults[],
  //   namespace: string
  // ): GraphDataRps[] => {
  //   // Initialize an empty array to store the transformed data.
  //   const mapGraph = new Map<string, DeploymentGraphRps[]>();
  //   results.forEach((data) => {
  //     const addData: DeploymentGraphRps = {
  //       rps: Number(data.value[1]),
  //       node: data.metric.node ?? 'unknown',
  //       pod: data.metric.pod ?? 'unknown',
  //       source_workload: data.metric.source_workload ?? 'unknown',
  //       source_version: data.metric.source_version ?? 'unknown', // the version is the node of the source
  //       source_workload_namespace: namespace,
  //       destination_service_name:
  //         data.metric.destination_service_name ?? 'unknown',
  //       destination_service_namespace:
  //         data.metric.destination_service_namespace ?? 'unknown',
  //       destination_version: data.metric.destination_version ?? 'unknown',
  //       destination_workload: data.metric.destination_workload ?? 'unknown',
  //     };

  //     if (mapGraph.has(data.metric.source_workload as string)) {
  //       mapGraph.get(data.metric.source_workload as string)?.push(addData);
  //     } else {
  //       mapGraph.set(data.metric.source_workload as string, [addData]);
  //     }
  //   });
  //   // Convert the Map to an array of objects for easier consumption
  //   return Array.from(mapGraph.entries()).map(([source, destinations]) => ({
  //     source,
  //     destinations,
  //   }));
  // },
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
      (pod) => pod.metric >= Config.metrics.upperThreshold
    );

    const belowThreshold = pods.filter(
      (pod) => pod.metric < Config.metrics.upperThreshold
    );

    return {
      aboveThreshold,
      belowThreshold,
    };
  },
};

import { Config } from '../config/config';

import type {
  DeploymentGraphRps,
  GraphDataRps,
  PromNodesLatency,
  PodResourceUsageType,
  PodRps,
  PrometheusResults,
  NodesLatency,
} from './types';

export const PrometheusMapper = {
  toDeploymentGraphDataRpsPerNode: (
    results: PrometheusResults[],
    namespace: string
  ): GraphDataRps[] => {
    // Initialize an empty array to store the transformed data.
    const mapGraph = new Map<string, DeploymentGraphRps[]>();
    results.forEach((data) => {
      const podMetrics = data.metric as PodRps;
      const addData: DeploymentGraphRps = {
        rps: Number(data.value[1]),
        node: podMetrics.node ?? 'unknown',
        pod: podMetrics.pod ?? 'unknown',
        source_workload: podMetrics.source_workload ?? 'unknown',
        source_version: podMetrics.source_version ?? 'unknown', // the version is the node of the source
        source_workload_namespace: namespace,
        destination_service_name:
          podMetrics.destination_service_name ?? 'unknown',
        destination_service_namespace:
          podMetrics.destination_service_namespace ?? 'unknown',
        destination_version: podMetrics.destination_version ?? 'unknown',
        destination_workload: podMetrics.destination_workload ?? 'unknown',
      };

      if (mapGraph.has(podMetrics.node ?? 'unknown')) {
        mapGraph.get(podMetrics.node ?? 'unknown')?.push(addData);
      } else {
        mapGraph.set(podMetrics.node ?? 'unknown', [addData]);
      }
    });
    // Convert the Map to an array of objects for easier consumption
    return Array.from(mapGraph.entries()).map(([node, destinations]) => ({
      node,
      destinations,
    }));
  },
  toNodesLatency(results: PrometheusResults[]): NodesLatency[] {
    return results.map((data) => {
      {
        const nodeMetrics = data.metric as PromNodesLatency;
        console.log(nodeMetrics);
        return {
          from: nodeMetrics.from_node,
          to: nodeMetrics.to_node,
          latency: Number(data.value[1]) / 1000, // convert microseconds to milliseconds
        };
      }
    });
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
      const podMetrics = data.metric as PodRps;

      const returnObject: PodResourceUsageType = {
        namespace: podMetrics.namespace,
        podName: podMetrics.pod,
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

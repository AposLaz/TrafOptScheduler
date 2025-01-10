import { convertResourcesStringToNumber } from '../common/helpers';
import { Config } from '../config/config';
import { TaintEffects } from '../enums';
import { LatencyProviderType } from './types';

import type {
  ClusterTopology,
  DeploymentNotReadyFilesystem,
  DeploymentPlacementModel,
  NodeLatency,
  NodeMetrics,
  PodMetrics,
  ZoneLatency,
} from './types';
import type * as k8s from '@kubernetes/client-node';

const k8sMapper = {
  toClusterTopology: (nodes: k8s.V1Node[]): ClusterTopology[] => {
    return nodes.map((node) => {
      return {
        region: node.metadata!.labels!['topology.kubernetes.io/region'],
        zone: node.metadata!.labels!['topology.kubernetes.io/zone'],
        node: node.metadata!.labels!['kubernetes.io/hostname'],
      };
    });
  },
  toDeployStore: (
    deployment: DeploymentPlacementModel
  ): DeploymentNotReadyFilesystem => ({
    deploymentName: deployment.deploymentName, // key is the pod name
    namespace: deployment.namespace,
    deletePod: deployment.deletePod,
  }),
  toNamespace: (
    ns: string,
    labels?: { [key: string]: string }
  ): k8s.V1Namespace => ({
    metadata: {
      name: ns,
      labels: {
        ...labels,
      },
    },
  }),
  toNodeTaints: (deploymentName: string): k8s.V1Taint => ({
    key: deploymentName, // key is the deployment name
    effect: TaintEffects.NO_SCHEDULE,
  }),
  toNodeLatency: (
    cluster: ClusterTopology[],
    latencies: LatencyProviderType[]
  ): NodeLatency[] => {
    const allLatencies: NodeLatency[] = [];

    // Ensure all node pairs are accounted for
    cluster.forEach((fromNode) => {
      cluster.forEach((toNode) => {
        // Find the latency for the specific zone pair
        const matchingLatency = latencies.flatMap((region) =>
          Object.values(region).flatMap((zoneLatencies: ZoneLatency[]) =>
            zoneLatencies.filter(
              (latency) =>
                latency.from === fromNode.zone && latency.to === toNode.zone
            )
          )
        )[0]; // Take the first match if found

        allLatencies.push({
          from: fromNode.node,
          to: toNode.node,
          latency: matchingLatency ? matchingLatency.latency : 0, // Default to 0 if no latency is found
        });
      });
    });

    return allLatencies.filter((latency) => latency.latency > 0);
  },
  toNodeResources: (nodes: k8s.NodeStatus[]): NodeMetrics[] => {
    // CPU to millicores & RAM to MB
    return nodes.map((node) => {
      const capacity = {
        cpu: Number(node.CPU.Capacity) * 1000,
        memory: Number(node.Memory.Capacity) / (1024 * 1024),
      };

      const allocatable = {
        cpu: convertResourcesStringToNumber(node.Node.status!.allocatable!.cpu),
        memory:
          convertResourcesStringToNumber(
            node.Node.status!.allocatable!.memory
          ) / 1024,
      };

      const requested = {
        cpu: Number(node.CPU.RequestTotal) * 1000,
        memory: Number(node.Memory.RequestTotal) / (1024 * 1024),
      };

      const limits = {
        cpu: Number(node.CPU.LimitTotal) * 1000,
        memory: Number(node.Memory.LimitTotal) / (1024 * 1024),
      };

      return {
        name: node.Node.metadata!.name as string,
        capacity: capacity,
        //Allocatable represents the resources of a node that are available for scheduling. Defaults to Capacity.
        allocatable: allocatable,
        requested: requested,
        limits: limits,
        freeToUse: {
          cpu: allocatable.cpu - requested.cpu,
          memory: allocatable.memory - requested.memory,
        },
      };
    });
  },
  toPodResources: (pods: k8s.PodStatus[]): PodMetrics[] => {
    // CPU to millicores & RAM to MB
    return pods.map((pod) => {
      const usageCpu = Number(pod.CPU.CurrentUsage) * 1000;
      const usageMem = Number(pod.Memory.CurrentUsage) / (1024 * 1024);
      const limitCpu = Number(pod.CPU.LimitTotal) * 1000;
      const limitMem = Number(pod.Memory.LimitTotal) / (1024 * 1024);

      const normalizedCpu = usageCpu / limitCpu;
      const normalizedMem = usageMem / limitMem;

      return {
        node: pod.Pod.spec!.nodeName as string,
        podName: pod.Pod.metadata!.name as string,
        usage: {
          cpu: usageCpu,
          memory: usageMem,
        },
        percentUsage: {
          cpu: normalizedCpu,
          memory: normalizedMem,
          cpuAndMemory:
            Config.metrics.weights.CPU * normalizedCpu +
            Config.metrics.weights.Memory * normalizedMem,
        },
        requested: {
          cpu: Number(pod.CPU.RequestTotal) * 1000,
          memory: Number(pod.Memory.RequestTotal) / (1024 * 1024),
        },
        limits: {
          cpu: limitCpu,
          memory: limitMem,
        },
      };
    });
  },
};

export { k8sMapper };

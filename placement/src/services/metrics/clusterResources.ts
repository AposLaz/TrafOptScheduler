/**
 * The placement will happen only and only if an alert from prometheus happens
 */

import prometheusApi from '../../api/prometheus/prometheusApi';
import { PrometheusTransformResultsToNode } from '../../api/prometheus/types';
import { Config } from '../../config/config';
import { logger } from '../../config/logger';
import { ClusterCommonResources, ClusterResourcesMemCpu } from './types';

const calculateMaxMetricPerNode = (
  array: PrometheusTransformResultsToNode[]
) => {
  const maxCpuUsageRequested = array.reduce<
    Record<string, PrometheusTransformResultsToNode>
  >((acc, curr) => {
    const { node, metric } = curr;
    if (!acc[node] || metric > acc[node].metric) {
      acc[node] = { node, metric };
    }
    return acc;
  }, {});

  return Object.values(maxCpuUsageRequested);
};

export const clusterCpu = async (): Promise<
  ClusterCommonResources[] | undefined
> => {
  // total cpu usage pods in each node
  const nodesTotalCpuPodsUsage =
    await prometheusApi.getTotalCpuUsedByPodsInEachNode(Config.SCHEDULE_TIME);

  if (!nodesTotalCpuPodsUsage) return;

  const nodesRequestedCpu = await prometheusApi.getNodesCpuRequestedByPods();

  if (!nodesRequestedCpu) return;

  // find max cpu between nodesTotalCpuPodsUsage & nodesRequestedCpu
  const combinedCpu = [...nodesTotalCpuPodsUsage, ...nodesRequestedCpu];

  const maxTotalCpuUsedOrRequested = calculateMaxMetricPerNode(combinedCpu);

  const nodesAllocateCpu = await prometheusApi.getNodesAllocateCpuForPods();

  if (!nodesAllocateCpu) return;

  const nodesMetricsCpu = maxTotalCpuUsedOrRequested.map((req) => {
    const alloc = nodesAllocateCpu.find((alloc) => alloc.node === req.node);
    if (alloc) {
      return {
        node: req.node,
        metrics: {
          allocation: alloc.metric,
          requested: req.metric,
          available: parseFloat((alloc.metric - req.metric).toFixed(2)),
        },
      };
    }
  });

  return nodesMetricsCpu as ClusterCommonResources[];
};

export const clusterMemory = async (): Promise<
  ClusterCommonResources[] | undefined
> => {
  // total memory usage pods in each node
  const nodesTotalMemoryPodsUsage =
    await prometheusApi.getTotalMemoryUsedByPodsInEachNode();

  if (!nodesTotalMemoryPodsUsage) return;

  const nodesRequestedMemory =
    await prometheusApi.getNodesMemoryRequestedByPods();

  if (!nodesRequestedMemory) return;

  const combinedMem = [...nodesTotalMemoryPodsUsage, ...nodesRequestedMemory];

  const maxTotalMemUsedOrRequested = calculateMaxMetricPerNode(combinedMem);

  const nodesAllocateMemory =
    await prometheusApi.getNodesAllocateMemoryForPods();

  if (!nodesAllocateMemory) return;

  // console.log(nodesAllocateMemory);

  const nodesMetricsMemory = maxTotalMemUsedOrRequested.map((req) => {
    const alloc = nodesAllocateMemory.find((alloc) => alloc.node === req.node);
    if (alloc) {
      return {
        node: req.node,
        metrics: {
          allocation: alloc.metric,
          requested: req.metric,
          available: parseFloat((alloc.metric - req.metric).toFixed(2)),
        },
      };
    }
  });

  return nodesMetricsMemory as ClusterCommonResources[];
};

export const clusterResources = async () => {
  const clusterCpuResources = await clusterCpu();
  if (!clusterCpuResources) {
    logger.error('Failed to get cluster cpu resources');
    return;
  }

  const clusterMemResources = await clusterMemory();
  if (!clusterMemResources) {
    logger.error('Failed to get cluster memory resources');
    return;
  }

  const clusterResourcesMemCpu = clusterCpuResources.map((cpuData) => {
    const memData = clusterMemResources.find(
      (memData) => memData.node === cpuData.node
    );
    if (memData) {
      return {
        node: cpuData.node,
        cpu: cpuData.metrics,
        memory: memData.metrics,
      };
    }
  });

  return clusterResourcesMemCpu as ClusterResourcesMemCpu[];

  // MEMORY
  // total total memory usage pods in each node

  //console.log(nodesMetricsMemory);

  // const podsRequestedCpu = await prometheusApi.getPodsRequestedCpuByNs(
  //   namespace
  // );

  // const podsRequestedMemory = await prometheusApi.getPodsRequestedMemoryByNs(
  //   namespace
  // );

  // const cpuUsagePods = await prometheusApi.getPodsCpuUsageByNs(namespace);

  // const memoryUsagePods = await prometheusApi.getPodsMemoryUsageByNs(namespace);
};

/**
 * The placement will happen only and only if an alert from prometheus happens
 */

import prometheusApi from '../api/prometheus/prometheusApi';
import { getK8sClient } from '../config/k8sClient';
import { logger } from '../config/logger';
// import { gkeSetupConfigs } from '../config/setup';
// import * as k8s from '@kubernetes/client-node';

type ClusterMetricsByNamespace = {
  namespace: string;
  nodes: {
    name: string;
    metrics: {
      memory: {
        available: number;
        allocation: number; // this is the memory that can be used by pods
        usage: number;
      };
      cpu: {
        available: number;
        allocation: number; // this is the cpu that can be used by pods
        requested: number;
      };
    };
    pods: {
      name: string;
      metrics: {
        memory: {
          requested: number;
          limit: number;
          usage: number;
        };
        cpu: {
          requested: number;
          limit: number;
          usage: number;
        };
      }[];
    }[];
  }[];
};
const main = async () => {
  //   const promIp = await gkeSetupConfigs();
  //   console.log(promIp.prometheusIP);
  const k8sClient = getK8sClient();
  if (!k8sClient) return;

  const prometheusIp = '10.106.109.230:9090';

  // const NamespaceMetricsByNode: ClusterMetricsByNamespace = [];

  const nodesRequestedCpu = await prometheusApi.getNodesCpuRequestedByPods(
    prometheusIp
  );

  if (!nodesRequestedCpu) return;

  console.log(nodesRequestedCpu);

  const nodesRequestedMemory =
    await prometheusApi.getNodesMemoryRequestedByPods(prometheusIp);

  if (!nodesRequestedMemory) return;

  console.log(nodesRequestedMemory);

  const nodesAllocateCpu = await prometheusApi.getNodesAllocateCpuForPods(
    prometheusIp
  );

  if (!nodesAllocateCpu) return;

  console.log(nodesAllocateCpu);

  const nodesAllocateMemory = await prometheusApi.getNodesAllocateMemoryForPods(
    prometheusIp
  );

  if (!nodesAllocateMemory) return;

  console.log(nodesAllocateMemory);

  const nodesMetricsCpu = nodesRequestedCpu.map((req) => {
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

  console.log(nodesMetricsCpu);

  const nodesMetricsMemory = nodesRequestedMemory.map((req) => {
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

  console.log(nodesMetricsMemory);

  const podsRequestedCpu = await prometheusApi.getPodsRequestedCpuByNs(
    prometheusIp,
    'online-boutique'
  );

  console.log(podsRequestedCpu);

  const podsRequestedMemory = await prometheusApi.getPodsRequestedMemoryByNs(
    prometheusIp,
    'online-boutique'
  );

  console.log(podsRequestedMemory);

  const cpuUsagePods = await prometheusApi.getPodsCpuUsageByNs(
    prometheusIp,
    'online-boutique'
  );

  console.log(cpuUsagePods);

  const memoryUsagePods = await prometheusApi.getPodsMemoryUsageByNs(
    prometheusIp,
    'online-boutique'
  );

  console.log(memoryUsagePods);
};

main();

/**
 * Need to store somewhere the data so that do not need to fetch them ever for requested cpu, Memory and limits etc....
 */

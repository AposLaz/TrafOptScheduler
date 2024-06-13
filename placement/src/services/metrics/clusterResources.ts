/**
 * The placement will happen only and only if an alert from prometheus happens
 */

import prometheusApi from '../../api/prometheus/prometheusApi';

export const clusterResources = async () => {
  //   const promIp = await gkeSetupConfigs();
  //   console.log(promIp.prometheusIP);

  const prometheusIp = '10.106.109.230:9090';
  const namespace = 'online-boutique';

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
    namespace
  );

  console.log(podsRequestedCpu);

  const podsRequestedMemory = await prometheusApi.getPodsRequestedMemoryByNs(
    prometheusIp,
    namespace
  );

  console.log(podsRequestedMemory);

  const cpuUsagePods = await prometheusApi.getPodsCpuUsageByNs(
    prometheusIp,
    namespace
  );

  console.log(cpuUsagePods);

  const memoryUsagePods = await prometheusApi.getPodsMemoryUsageByNs(
    prometheusIp,
    namespace
  );

  console.log(memoryUsagePods);
};

/**
 * Try to scheduling communities to nodes that are more loaded by cpu and ram
 */

import { getK8sClient } from '../../config/k8sClient';
import { CommunitiesReplicaPods, PartitionsType } from './types';
import { clusterResources } from '../../services/metrics/clusterResources';
import * as k8s from '@kubernetes/client-node';
import prometheusApi from '../../api/prometheus/prometheusApi';
/**
 * Accept communities of modsoft and nodes
 */

/**
 * Almost all deployments have replicas. If number of deployments replicas is > 1
 * then find affinity for each partition in community and calculate the node affinity between these two pods
 */

/**
 * Before scheduling add annotations that says that these services are scheduled so to not scheduled them again
 */

export const binPacking = async (communities: PartitionsType, ns: string) => {
  const clResources = await clusterResources();

  if (!clResources) return;

  const distinctKeysCommunities = new Set<string>();

  for (const [service, dependencies] of Object.entries(communities)) {
    distinctKeysCommunities.add(service);
    for (const dependency in dependencies) {
      distinctKeysCommunities.add(dependency);
    }
  }

  const distinctPartitionsOfCom = Array.from(distinctKeysCommunities);

  const k8sClient = getK8sClient();
  if (!k8sClient) return;
  const k8sApi = k8sClient.makeApiClient(k8s.CoreV1Api);

  const replicas = await k8sApi.listNamespacedPod(ns);

  const communitiesReplicas: CommunitiesReplicaPods = {};

  for (const pod of replicas.body.items) {
    const podName = pod.metadata?.name;
    if (podName) {
      const podExists = distinctPartitionsOfCom.find((partition) =>
        podName.startsWith(partition)
      );
      if (podExists) {
        // for each replica pod find max of usage and request resources.
        // And after reduce these values from available resources of Cluster
        // we do that because we are going to re-schedule pods in Cluster

        const usageCpu = await prometheusApi.getTotalCpuUsedByPod(
          podName,
          ns,
          '30m'
        );

        if (!usageCpu) return;

        const requestedCpu = await prometheusApi.getRequestedCpuByPod(
          podName,
          ns
        );

        if (!requestedCpu) return;

        const podCpuMetric = Math.max(usageCpu, requestedCpu);

        const usageMemory = await prometheusApi.getTotalMemoryUsedByPod(
          podName,
          ns
        );

        if (!usageMemory) return;

        const requestedMemory = await prometheusApi.getRequestedMemoryByPod(
          podName,
          ns
        );

        if (!requestedMemory) return;

        const podMemoryMetric = Math.max(usageMemory, requestedMemory);

        const i = clResources.findIndex(
          (inst) => inst.node === pod.spec!.nodeName!
        );

        // update resources of cluster
        clResources[i].cpu.available += podCpuMetric;
        clResources[i].memory.available += podMemoryMetric;

        // Initialize the array if it doesn't exist
        if (!communitiesReplicas[podExists]) {
          communitiesReplicas[podExists] = [];
        }
        communitiesReplicas[podExists].push({
          pod: podName,
          node: pod.spec!.nodeName!,
          mem: podMemoryMetric,
          cpu: podCpuMetric,
        });
      }
    }
  }

  //for each value get max request resources or usage resources and reduce the value from cluster resources

  //console.log(communitiesReplicas);
  console.log(clResources);

  // in case of replicas....if number of replicas = 2 then spread replicas to 2 zones
};

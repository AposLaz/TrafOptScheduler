import { PodMetrics } from '../../adapters/k8s/types.js';
import { PrometheusAdapterImpl } from '../../adapters/prometheus/index.js';
import { logger } from '../../config/logger.js';
import { DeploymentReplicaPodsMetrics, MetricWeights } from '../../types.js';

export const addMissingResources = async (
  data: DeploymentReplicaPodsMetrics,
  namespace: string,
  weights: MetricWeights,
  prometheus: PrometheusAdapterImpl
): Promise<DeploymentReplicaPodsMetrics> => {
  const avgTime = '2m';
  const result: DeploymentReplicaPodsMetrics = {};

  for (const [service, pods] of Object.entries(data)) {
    result[service] = (
      await Promise.all(
        pods.map(async (pod) => {
          const updatedPod = { ...pod };
          const shouldRecalculate =
            updatedPod.percentUsage.cpu == null ||
            updatedPod.percentUsage.memory == null ||
            updatedPod.percentUsage.cpuAndMemory == null ||
            isNaN(updatedPod.percentUsage.cpu) ||
            isNaN(updatedPod.percentUsage.memory) ||
            isNaN(updatedPod.percentUsage.cpuAndMemory) ||
            !Number.isFinite(updatedPod.percentUsage.cpu) ||
            !Number.isFinite(updatedPod.percentUsage.memory) ||
            !Number.isFinite(updatedPod.percentUsage.cpuAndMemory);

          if (shouldRecalculate) {
            const cpuUsage =
              pod.usage.cpu === 0 ? await prometheus.getCurrentPodCpuUsage(pod.pod, namespace) : pod.usage.cpu;
            const memUsage =
              pod.usage.memory === 0 ? await prometheus.getCurrentPodMemoryUsage(pod.pod, namespace) : pod.usage.memory;

            if (!cpuUsage || !memUsage) {
              logger.info(`Skipping pod ${pod.pod} due to missing resource data.`);
              return null;
            }

            const requestedCpu = await prometheus.getAvgPodCpuUsage(pod.pod, namespace, avgTime);
            const requestedMemory = await prometheus.getAvgPodMemoryUsage(pod.pod, namespace, avgTime);

            if (!requestedCpu || !requestedMemory) {
              const cpuMem = weights.CPU * cpuUsage + weights.Memory * memUsage;

              updatedPod.usage = {
                cpu: cpuUsage,
                memory: memUsage,
              };
              updatedPod.percentUsage = {
                cpu: cpuUsage / (2 * cpuUsage),
                memory: memUsage / (2 * memUsage),
                cpuAndMemory: cpuMem / (cpuMem * 2),
              };
              updatedPod.requested = {
                cpu: cpuUsage,
                memory: memUsage,
              };
              updatedPod.limits = {
                cpu: cpuUsage * 2,
                memory: memUsage * 2,
              };

              return updatedPod;
            }

            const limitCpu = requestedCpu * 2;
            const limitMem = requestedMemory * 2;
            const percentCpu = cpuUsage / limitCpu;
            const percentMem = memUsage / limitMem;
            const percentCpuAndMem = weights.CPU * percentCpu + weights.Memory * percentMem;

            updatedPod.usage = {
              cpu: cpuUsage,
              memory: memUsage,
            };
            updatedPod.percentUsage = {
              cpu: percentCpu,
              memory: percentMem,
              cpuAndMemory: percentCpuAndMem,
            };
            updatedPod.requested = {
              cpu: requestedCpu,
              memory: requestedMemory,
            };
            updatedPod.limits = {
              cpu: limitCpu,
              memory: limitMem,
            };
          }

          return updatedPod;
        })
      )
    ).filter((pod): pod is PodMetrics => pod !== null);
  }

  return result;
};

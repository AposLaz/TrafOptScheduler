import { logger } from '../../../config/logger.ts';
import { PrometheusMapper } from '../mapper.ts';
import { executePrometheusQuery } from '../utils.ts';

import type { PodResourceUsageType } from '../types.ts';

export class ResourcesMetricsService {
  constructor(private readonly prometheusUrl: string) {
    this.prometheusUrl = prometheusUrl;
  }

  async fetchNodesLatency(time: string) {
    try {
      const query = `avg_over_time(node_avg_latency_ms[${time}])`;
      console.log(query);
      const result = await executePrometheusQuery(this.prometheusUrl, query);

      if (!result || result.data.result.length === 0) {
        logger.warn(`No data returned for query: ${query}`);
        return;
      }

      return result.data.result;
    } catch (e: unknown) {
      const error = e as Error;
      logger.error(error);
      return;
    }
  }

  async fetchPodCpuUsageRelativeToLimit(namespace: string, time: string): Promise<PodResourceUsageType[] | undefined> {
    try {
      const query = `sum(rate(container_cpu_usage_seconds_total{container!="", pod !="" ,namespace="${namespace}"}[${time}m])) by (pod,namespace) / sum(kube_pod_container_resource_limits{resource="cpu",namespace="${namespace}", container !="", pod !=""}) by (pod,namespace)`;

      const result = await executePrometheusQuery(this.prometheusUrl, query);

      if (!result || result.data.result.length === 0) {
        logger.warn(`No data returned for query: ${query}`);
        return;
      }

      return PrometheusMapper.toPodResourceUsage(result.data.result);
    } catch (e: unknown) {
      const error = e as Error;
      logger.error(error);
      return;
    }
  }

  async fetchPodMemoryUsageRelativeToLimit(namespace: string): Promise<PodResourceUsageType[] | undefined> {
    try {
      // memory usage 100%
      const query = `sum(container_memory_working_set_bytes{namespace="${namespace}", pod!="", container != ""}) by (pod,namespace) / sum(kube_pod_container_resource_limits{resource="memory",namespace="${namespace}", container != "", pod !=""}) by (pod,namespace)`;

      const result = await executePrometheusQuery(this.prometheusUrl, query);

      if (!result || result.data.result.length === 0) {
        logger.warn(`No data returned for query: ${query}`);
        return;
      }

      return PrometheusMapper.toPodResourceUsage(result.data.result);
    } catch (e: unknown) {
      const error = e as Error;
      logger.error(error);
      return;
    }
  }

  async fetchPodCpuMemoryUsageRelativeToLimit(
    namespace: string,
    time: string
  ): Promise<PodResourceUsageType[] | undefined> {
    const weightCpu = 0.5;
    const weightMemory = 0.5;

    const [cpuUsage, memoryUsage] = await Promise.all([
      this.fetchPodCpuUsageRelativeToLimit(namespace, time),
      this.fetchPodMemoryUsageRelativeToLimit(namespace),
    ]);

    if (!cpuUsage || !memoryUsage) {
      logger.error('Error fetching CPU and memory usage data for find the Multicriteria score');
      return;
    }

    // calculate multicriteria function
    const podCpuMemoryUsage = cpuUsage
      .map((podCpu) => {
        const podMemory = memoryUsage.find((podMem) => podMem.podName === podCpu.podName);

        if (!podMemory) {
          logger.error(`No memory data for pod: "${podCpu.podName}"`);
          return;
        }

        return {
          podName: podCpu.podName,
          namespace: podCpu.namespace,
          metric: podCpu.metric * weightCpu + podMemory.metric * weightMemory,
        };
      })
      .filter((pod) => pod !== undefined);

    return podCpuMemoryUsage;
  }
}

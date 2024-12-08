import { MetricsType } from '../enums';

import type { PodMetrics, PodResourceUsageType } from '../types';

interface ThresholdStrategy {
  evaluateThreshold(
    podMetrics: PodMetrics[],
    threshold: number
  ): Promise<PodResourceUsageType>;
}

class CpuThresholdStrategy implements ThresholdStrategy {
  async evaluateThreshold(
    podMetrics: PodMetrics[],
    threshold: number
  ): Promise<PodResourceUsageType> {
    const abovePods = podMetrics.filter(
      (pod) => pod.percentUsage.cpu >= threshold
    );

    const belowPods = podMetrics.filter(
      (pod) => pod.percentUsage.cpu < threshold
    );

    return {
      aboveThreshold: abovePods,
      belowThreshold: belowPods,
    };
  }
}

class MemoryThresholdStrategy implements ThresholdStrategy {
  async evaluateThreshold(
    podMetrics: PodMetrics[],
    threshold: number
  ): Promise<PodResourceUsageType> {
    const abovePods = podMetrics.filter(
      (pod) => pod.percentUsage.memory >= threshold
    );

    const belowPods = podMetrics.filter(
      (pod) => pod.percentUsage.memory < threshold
    );

    return {
      aboveThreshold: abovePods,
      belowThreshold: belowPods,
    };
  }
}

class CpuAndMemoryThresholdStrategy implements ThresholdStrategy {
  async evaluateThreshold(
    podMetrics: PodMetrics[],
    threshold: number
  ): Promise<PodResourceUsageType> {
    const abovePods = podMetrics.filter(
      (pod) => pod.percentUsage.cpuAndMemory >= threshold
    );

    const belowPods = podMetrics.filter(
      (pod) => pod.percentUsage.cpuAndMemory < threshold
    );

    return {
      aboveThreshold: abovePods,
      belowThreshold: belowPods,
    };
  }
}

export class ThresholdStrategyFactory {
  static getStrategy(metric: MetricsType): ThresholdStrategy {
    switch (metric) {
      case MetricsType.CPU:
        return new CpuThresholdStrategy();
      case MetricsType.MEMORY:
        return new MemoryThresholdStrategy();
      case MetricsType.CPU_MEMORY:
        return new CpuAndMemoryThresholdStrategy();
      default:
        throw new Error(
          `Invalid metric provided. Expected one of ${Object.values(MetricsType).join(', ')}`
        );
    }
  }
}

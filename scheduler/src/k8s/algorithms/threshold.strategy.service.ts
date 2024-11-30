import { MetricsType } from '../enums';

import type { PodMetrics, ThresholdPodsEvaluationResult } from '../types';

interface ThresholdStrategy {
  evaluateThreshold(
    podMetrics: PodMetrics[],
    threshold: number
  ): Promise<ThresholdPodsEvaluationResult>;
}

class CpuThresholdStrategy implements ThresholdStrategy {
  async evaluateThreshold(
    podMetrics: PodMetrics[],
    threshold: number
  ): Promise<ThresholdPodsEvaluationResult> {
    const abovePods = podMetrics.filter(
      (pod) => pod.usage.cpu >= threshold * pod.limits.cpu
    );

    const belowPods = podMetrics.filter(
      (pod) => pod.usage.cpu < threshold * pod.limits.cpu
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
  ): Promise<ThresholdPodsEvaluationResult> {
    const abovePods = podMetrics.filter(
      (pod) => pod.usage.memory >= threshold * pod.limits.memory
    );

    const belowPods = podMetrics.filter(
      (pod) => pod.usage.memory < threshold * pod.limits.memory
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
  ): Promise<ThresholdPodsEvaluationResult> {
    const abovePods = podMetrics.filter(
      (pod) =>
        pod.usage.cpu / pod.limits.cpu + pod.usage.memory / pod.limits.memory >=
        threshold
    );

    const belowPods = podMetrics.filter(
      (pod) =>
        pod.usage.cpu / pod.limits.cpu + pod.usage.memory / pod.limits.memory <
        threshold
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

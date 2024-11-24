import { MetricsThreshold } from '../../enums';
import { PodMetrics, ThresholdEvaluationResult } from '../../types';

interface ThresholdStrategy {
  evaluateThreshold(
    podMetrics: PodMetrics[],
    threshold: number
  ): Promise<ThresholdEvaluationResult>;
}

class CpuThresholdStrategy implements ThresholdStrategy {
  async evaluateThreshold(
    podMetrics: PodMetrics[],
    threshold: number
  ): Promise<ThresholdEvaluationResult> {
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
  ): Promise<ThresholdEvaluationResult> {
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
  ): Promise<ThresholdEvaluationResult> {
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
  static getStrategy(metric: MetricsThreshold): ThresholdStrategy {
    switch (metric) {
      case MetricsThreshold.CPU:
        return new CpuThresholdStrategy();
      case MetricsThreshold.MEMORY:
        return new MemoryThresholdStrategy();
      case MetricsThreshold.CPU_MEMORY:
        return new CpuAndMemoryThresholdStrategy();
      default:
        throw new Error(
          `Invalid metric provided. Expected one of ${Object.values(MetricsThreshold).join(', ')}`
        );
    }
  }
}

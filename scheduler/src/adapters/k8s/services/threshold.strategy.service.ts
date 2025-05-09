import { MetricsType } from '../../../enums.ts';
import { avgDeploymentMetricByNode, classifyDeploymentsByLoad } from '../utils.ts';

import type { DeploymentReplicaPodsMetrics } from '../../../types.ts';
import type { CriticalDeploymentsNodeUsage, ThresholdType } from '../types.ts';

interface ThresholdStrategy {
  evaluateThreshold(deployments: DeploymentReplicaPodsMetrics, threshold: ThresholdType): CriticalDeploymentsNodeUsage;
}

class CpuThresholdStrategy implements ThresholdStrategy {
  evaluateThreshold(deployments: DeploymentReplicaPodsMetrics, threshold: ThresholdType): CriticalDeploymentsNodeUsage {
    const deployNodeUsage = avgDeploymentMetricByNode(deployments, MetricsType.CPU);

    return classifyDeploymentsByLoad(deployNodeUsage, threshold);
  }
}

class MemoryThresholdStrategy implements ThresholdStrategy {
  evaluateThreshold(deployments: DeploymentReplicaPodsMetrics, threshold: ThresholdType): CriticalDeploymentsNodeUsage {
    const deployNodeUsage = avgDeploymentMetricByNode(deployments, MetricsType.MEMORY);

    return classifyDeploymentsByLoad(deployNodeUsage, threshold);
  }
}

class CpuAndMemoryThresholdStrategy implements ThresholdStrategy {
  evaluateThreshold(deployments: DeploymentReplicaPodsMetrics, threshold: ThresholdType): CriticalDeploymentsNodeUsage {
    const deployNodeUsage = avgDeploymentMetricByNode(deployments, MetricsType.CPU_MEMORY);

    return classifyDeploymentsByLoad(deployNodeUsage, threshold);
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
        throw new Error(`Invalid metric provided. Expected one of ${Object.values(MetricsType).join(', ')}`);
    }
  }
}

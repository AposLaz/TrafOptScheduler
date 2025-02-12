import type { DeploymentReplicaPodsMetrics } from '../../types';
import type { MetricsType } from '../enums';
import type {
  CriticalDeploymentsNodeUsage,
  DeploymentNodeUsage,
  ThresholdType,
} from '../types';

export const avgDeploymentMetricByNode = (
  deployments: DeploymentReplicaPodsMetrics,
  metricType: MetricsType
) => {
  const metricDeployments: DeploymentNodeUsage = {};

  for (const [deployment, replicaPods] of Object.entries(deployments)) {
    const nodeMemoryUsage: { [key: string]: number } = {};

    replicaPods.forEach(({ node, percentUsage }) => {
      if (!nodeMemoryUsage[node]) {
        nodeMemoryUsage[node] = 0;
      }

      if (metricType === 'cpu') {
        nodeMemoryUsage[node] += percentUsage.cpu;
      } else if (metricType === 'memory') {
        nodeMemoryUsage[node] += percentUsage.memory;
      } else {
        nodeMemoryUsage[node] += percentUsage.cpuAndMemory;
      }
    });

    metricDeployments[deployment] = Object.entries(nodeMemoryUsage).map(
      ([node, metric]) => ({ node, avgMetric: metric / replicaPods.length })
    );
  }

  return metricDeployments;
};

export const classifyDeploymentsByLoad = (
  deployments: DeploymentNodeUsage,
  threshold: ThresholdType
): CriticalDeploymentsNodeUsage => {
  const highLoadedNodes: DeploymentNodeUsage = {};
  const lowLoadedNodes: DeploymentNodeUsage = {};

  for (const [deployment, nodes] of Object.entries(deployments)) {
    highLoadedNodes[deployment] = nodes.filter(
      ({ avgMetric }) => avgMetric > threshold.upper
    );
    lowLoadedNodes[deployment] = nodes.filter(
      ({ avgMetric }) => avgMetric < threshold.lower
    );
  }

  return { highLoadedNodes, lowLoadedNodes };
};

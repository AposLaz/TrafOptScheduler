import * as k8s from '@kubernetes/client-node';

import { ThresholdStrategyFactory } from '../algorithms/threshold.strategy.service';
import { k8sMapper } from '../mapper';

import type {
  NodeMetrics,
  PodMetrics,
  ThresholdPodsEvaluationResult,
} from '../types';
import type { ConfigMetrics } from '../types';

export class MetricsService {
  private metricClient: k8s.Metrics;
  private coreClient: k8s.CoreV1Api;
  private metrics: ConfigMetrics;

  constructor(
    metricClient: k8s.Metrics,
    coreClient: k8s.CoreV1Api,
    metrics: ConfigMetrics
  ) {
    this.metricClient = metricClient;
    this.coreClient = coreClient;

    this.metrics = metrics;
  }

  async getNodesMetrics(): Promise<NodeMetrics[]> {
    const topNodes = await k8s.topNodes(this.coreClient);

    const nodeResources = k8sMapper.toNodeResources(topNodes);

    return nodeResources;
  }

  async getPodsMetrics(namespace: string): Promise<PodMetrics[]> {
    const topPods = await k8s.topPods(
      this.coreClient,
      this.metricClient,
      namespace
    );

    const pods = k8sMapper.toPodResources(topPods);
    return pods;
  }

  /**
   *
   * TODO REMOVE THIS METHOD BECAUSE THE PROMETHEUS IS USED FOR THIS PROPOSED
   */
  async classifyPodsByThreshold(
    namespace: string
  ): Promise<ThresholdPodsEvaluationResult> {
    const pods = await this.getPodsMetrics(namespace);

    const resourcePods = ThresholdStrategyFactory.getStrategy(
      this.metrics.type
    ).evaluateThreshold(pods, this.metrics.threshold);

    return resourcePods;
  }
}

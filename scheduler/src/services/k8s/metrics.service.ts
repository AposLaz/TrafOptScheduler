import * as k8s from '@kubernetes/client-node';
import { k8sMapper } from '../../mapper/k8s.mapper';
import { NodeMetrics, PodMetrics } from '../../types';

export class MetricsService {
  private metricClient: k8s.Metrics;
  private coreClient: k8s.CoreV1Api;

  constructor(metricClient: k8s.Metrics, coreClient: k8s.CoreV1Api) {
    this.metricClient = metricClient;
    this.coreClient = coreClient;
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

  async classifyPodsByThreshold(
    namespace: string,
    metrics: [],
    threshold: number
  ) {
    const pods = await this.getPodsMetrics(namespace);

    console.log(pods);
  }
}

import * as k8s from '@kubernetes/client-node';
import { k8sMapper } from '../../../mapper/k8s.mapper';
import { K8sClientApiFactory } from '../../../config/k8sClient';
import { K8sClientTypeApi } from '../../../enums';

export class MetricsAdapter {
  private metricClient: k8s.Metrics;
  private apiClient: k8s.CoreV1Api;

  constructor() {
    this.metricClient = K8sClientApiFactory.getClient(
      K8sClientTypeApi.METRICS
    ) as k8s.Metrics;

    this.apiClient = K8sClientApiFactory.getClient(
      K8sClientTypeApi.CORE
    ) as k8s.CoreV1Api;
  }

  async getPodsResources(namespace: string) {
    const topPods = await k8s.topPods(
      this.apiClient,
      this.metricClient,
      namespace
    );

    const pods = k8sMapper.toPodResources(topPods);
    return pods;
  }

  async getNodesResources() {
    const topNodes = await k8s.topNodes(this.apiClient);

    const nodeResources = k8sMapper.toNodeResources(topNodes);

    return nodeResources;
  }
}

import { logger } from '../../config/logger';

import type * as k8s from '@kubernetes/client-node';

export class PodService {
  private client: k8s.CoreV1Api;
  constructor(client: k8s.CoreV1Api) {
    this.client = client;
  }

  async fetchPodsByNamespace(namespace: string) {
    const res = await this.client.listNamespacedPod(namespace);
    return res.body.items;
  }

  async fetchPodsByLabels(namespace: string, label?: string) {
    const pods = await this.client.listNamespacedPod(
      namespace,
      undefined,
      undefined,
      undefined,
      undefined,
      label
    );

    if (pods.body.items.length === 0) return;

    return pods.body.items;
  }

  async deletePod(podName: string, namespace: string) {
    logger.info(`Deleting pod ${podName} from namespace ${namespace}`);
    await this.client.deleteNamespacedPod(podName, namespace);
  }
}

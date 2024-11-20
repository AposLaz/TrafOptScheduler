import * as k8s from '@kubernetes/client-node';
import { K8sClientApiFactory } from '../../../config/k8sClient';
import { K8sClientTypeApi } from '../../../enums';
import { k8sMapper } from '../../../mapper/k8s.mapper';
import { logger } from '../../../config/logger';

export class NamespaceAdapter {
  private client: k8s.CoreV1Api;
  constructor() {
    this.client = K8sClientApiFactory.getClient(
      K8sClientTypeApi.CORE
    ) as k8s.CoreV1Api;
  }

  async createNamespaceIfNotExists(
    ns: string,
    labels?: { [key: string]: string }
  ) {
    try {
      const namespace = k8sMapper.toNamespace(ns, labels);
      const res = await this.client.createNamespace(namespace);

      logger.info(`New namespace created: ${res.body.metadata!.name}`);
    } catch (error: unknown) {
      const err = error as k8s.HttpError;
      // if namespace does not exists then create it
      if (err.body.code === 409) {
        logger.info(`Namespace already exists: ${ns}`);
        return;
      }

      logger.error(`Error creating namespace: ${ns} / ${err.message}`);
    }
  }
}

import * as k8s from '@kubernetes/client-node';

import { logger } from '../../../config/logger';

import type { ReplicasAction } from '../types';

export class DeploymentService {
  private readonly client: k8s.AppsV1Api;

  constructor(client: k8s.AppsV1Api) {
    this.client = client;
  }

  async fetchDeploymentsByNamespace(ns: string) {
    const res = await this.client.listNamespacedDeployment(ns);

    // get Deployments on Namespace
    const deployments = res.body.items.filter((deploy) => deploy.metadata?.name !== undefined);
    if (deployments.length === 0) {
      logger.warn(`No Deployments found on Namespace: ${ns}`);
      return;
    }

    return deployments;
  }

  async fetchNamespacedDeployments(deployment: string, ns: string) {
    const res = await this.client.readNamespacedDeployment(deployment, ns);
    return res.body;
  }

  async fetchDeploymentReplicaSetsByNamespace(ns: string) {
    // get Replica sets on Namespace
    const res = await this.client.listNamespacedReplicaSet(ns);
    const replicaSets = res.body.items.filter((rs) =>
      rs.metadata?.ownerReferences?.some((owner) => owner.kind === 'Deployment')
    );
    if (replicaSets.length === 0) {
      logger.warn(`No Replica Sets found on Namespace: ${ns}`);
      return;
    }

    return replicaSets;
  }

  async handleDeployReplicas(deployName: string, ns: string, action: ReplicasAction) {
    const deploy = await this.client.readNamespacedDeployment(deployName, ns);

    if (action === 'add') {
      logger.info(`Adding 1 replicas to deployment ${deployName}`);
      deploy.body.spec!.replicas!++;
    }
    if (action === 'delete') {
      logger.info(`Deleting 1 replicas to deployment ${deployName}`);
      deploy.body.spec!.replicas!--;
    }

    // update replicas
    await this.client.patchNamespacedDeployment(
      deployName,
      ns,
      deploy.body,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      {
        headers: {
          'Content-Type': k8s.PatchUtils.PATCH_FORMAT_STRATEGIC_MERGE_PATCH,
        },
      }
    );
  }
}

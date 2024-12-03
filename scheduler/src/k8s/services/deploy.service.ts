import { logger } from '../../config/logger';

import type * as k8s from '@kubernetes/client-node';

// import { sleep } from '../../common/helpers';
// import { logger } from '../../config/logger';

// import type { ReplicasAction } from '../../types';

export class DeploymentService {
  private client: k8s.AppsV1Api;

  constructor(client: k8s.AppsV1Api) {
    this.client = client;
  }

  async fetchDeploymentsByNamespace(ns: string) {
    const res = await this.client.listNamespacedDeployment(ns);

    // get Deployments on Namespace
    const deployments = res.body.items.filter(
      (deploy) => deploy.metadata?.name !== undefined
    );
    if (deployments.length === 0) {
      logger.warn(`No Deployments found on Namespace: ${ns}`);
      return;
    }

    return deployments;
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
}

/*
export const deploymentMatchLabels = async (
  k8sClient: k8s.AppsV1Api,
  deployName: string,
  ns: string
) => {
  const deploy = await k8sClient.readNamespacedDeployment(deployName, ns);
  const matchLabels = deploy.body.spec?.selector.matchLabels;

  return matchLabels;
};

// add replicas
export const handleDeployReplicas = async (
  k8sClient: k8s.AppsV1Api,
  deployName: string,
  ns: string,
  action: ReplicasAction
) => {
  const deploy = await k8sClient.readNamespacedDeployment(deployName, ns);

  if (action === 'add') {
    logger.info(`Adding 1 replicas to deployment ${deployName}`);
    deploy.body.spec!.replicas!++;
  }
  if (action === 'delete') {
    logger.info(`Deleting 1 replicas to deployment ${deployName}`);
    deploy.body.spec!.replicas!--;
  }

  // update replicas
  await k8sClient.patchNamespacedDeployment(
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
};

// check if the deployment is ready
export const readyStatusDeploy = async (
  k8sClient: k8s.AppsV1Api,
  deployName: string,
  ns: string,
  maxRound: number
): Promise<boolean> => {
  let status = 'NotReady';
  let round = 0;

  while (round < maxRound) {
    console.log('Deploy - ' + deployName + ' - round - ' + round);
    // wait one second for each repeat
    await sleep(1000);
    round++;

    const deploymentResponse = await k8sClient.readNamespacedDeployment(
      deployName,
      ns
    );
    const deployment = deploymentResponse.body;

    // Check if all replicas are ready
    const desiredReplicas = deployment.spec!.replicas || 0;
    const readyReplicas = deployment.status?.readyReplicas || 0;

    readyReplicas === desiredReplicas && (status = 'Ready');

    if (status === 'Ready') {
      logger.info(`All replicas are ready for deployment: ${deployName}`);

      return true;
    }
  }

  logger.error(
    `All replicas are not ready for deployment add it to queue: ${deployName}`
  );
  return false;
};
*/

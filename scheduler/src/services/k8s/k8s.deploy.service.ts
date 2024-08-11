import * as k8s from '@kubernetes/client-node';
import { ReplicasAction } from '../../types';
import { sleep } from '../../common/helpers';
import { logger } from '../../config/logger';

// add replicas
export const handleDeployReplicas = async (
  k8sClient: k8s.AppsV1Api,
  deployName: string,
  ns: string,
  action: ReplicasAction
) => {
  const deploy = await k8sClient.readNamespacedDeployment(deployName, ns);

  if (action === 'add') deploy.body.spec!.replicas!++;
  if (action === 'delete') {
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

export const readyStatusDeploy = async (
  k8sClient: k8s.AppsV1Api,
  deployName: string,
  ns: string,
  maxRound: number
): Promise<boolean> => {
  let status = 'NotReady';
  let round = 0;

  while (round < maxRound) {
    console.log(round);
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
      logger.info(
        `[INFO] All replicas are ready for deployment: ${deployName}`
      );

      return true;
    }
  }

  logger.error(
    `[ERROR] All replicas are not ready for deployment add it to queue: ${deployName}`
  );
  return false;
};

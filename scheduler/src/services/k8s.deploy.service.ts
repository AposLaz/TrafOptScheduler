import * as k8s from '@kubernetes/client-node';
import { ReplicasAction } from '../types';
import { sleep } from '../common/helpers';

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
  ns: string
) => {
  let status = 'NotReady';
  const maxTime = 10;
  let time = 0;

  while (status !== 'Ready' && time < maxTime) {
    console.log(time);
    // wait one second for each repeat
    await sleep(2000);
    time++;

    const deploymentResponse = await k8sClient.readNamespacedDeployment(
      deployName,
      ns
    );
    const deployment = deploymentResponse.body;

    // Check if all replicas are ready
    const desiredReplicas = deployment.spec!.replicas || 0;
    const readyReplicas = deployment.status?.readyReplicas || 0;

    readyReplicas === desiredReplicas && (status = 'Ready');
  }
};

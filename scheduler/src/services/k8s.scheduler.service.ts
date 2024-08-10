import { logger } from '../config/logger';
import { getAppsApiClient, getCoreApiClient } from './k8s.client.service';
import { handleDeployReplicas, readyStatusDeploy } from './k8s.deploy.service';
import { addTaints, deleteTaints } from './k8s.node.service';
import { deletePod } from './k8s.pod.service';

const deploy1 = 'server-app-deployment';
const deploy2 = 'pong-server-deployment';

const namespace = 'default';

const taints = [
  {
    key: 'pong-server-deployment',
    effect: 'NoSchedule',
  },
  // {
  //   key: 'server-app-deployment',
  //   effect: 'NoSchedule',
  // },
  // {
  //   key: 'test',
  //   effect: 'NoSchedule',
  // },
];

const podName = 'pong-server-deployment-7f8c75f965-8jcmn';
const scheduledNode = 'gke-cluster-0-default-pool-febfcf83-d3vr';

export const scheduler = async () => {
  try {
    const apiK8sClient = getCoreApiClient();
    const appsApiK8sClient = getAppsApiClient();

    // taint nodes
    await addTaints(apiK8sClient, scheduledNode, taints);

    // create new pod
    await handleDeployReplicas(appsApiK8sClient, deploy2, namespace, 'add');

    // delete taints from nodes
    const taintKeys = taints.map((taint) => taint.key);
    await deleteTaints(apiK8sClient, taintKeys);

    // wait until all replica pods of the deployment are READY
    await readyStatusDeploy(appsApiK8sClient, deploy2, namespace);

    // delete a pod from a specific node
    await deletePod(apiK8sClient, podName, namespace);
    // decrease replicas
    await handleDeployReplicas(appsApiK8sClient, deploy2, namespace, 'delete');
  } catch (error: unknown) {
    logger.error(error);
  }
};

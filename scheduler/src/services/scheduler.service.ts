import { logger } from '../config/logger';
import { k8sMapper } from '../mapper/mapper';
import { DeploymentPlacementModel } from '../types';
import { getAppsApiClient, getCoreApiClient } from './k8s/k8s.client.service';
import {
  handleDeployReplicas,
  readyStatusDeploy,
} from './k8s/k8s.deploy.service';
import { addTaint, deleteTaint } from './k8s/k8s.node.service';
import { deletePod } from './k8s/k8s.pod.service';
import * as k8s from '@kubernetes/client-node';
import { retryUntilReadyStatusDeploy } from './queue.notReadyPods.service';
import { Semaphore } from '../handler/semaphore.handler';
import { SemaphoreConcLimits } from '../enums';

const deployModels: DeploymentPlacementModel[] = [
  {
    deploymentName: 'server-app-deployment',
    node: 'gke-cluster-0-default-pool-febfcf83-d3vr',
    namespace: 'default',
    deletePod: 'server-app-deployment-febfcf83-d3vr', // delete a random pod from another node
  },
  {
    deploymentName: 'pong-server-deployment',
    node: 'gke-cluster-0-default-pool-febfcf83-d3vr',
    namespace: 'default',
    deletePod: 'pong-server-deployment-febfcf83-d3vr',
  },
];

// Initialize the semaphore with the desired concurrency limit
const semaphore = Semaphore.getInstance(SemaphoreConcLimits.MAX_CONCURRENCY); // Get the singleton instance with a max of default 20 concurrent tasks

export const scheduler = async () => {
  try {
    const apiK8sClient = getCoreApiClient();
    const appsApiK8sClient = getAppsApiClient();

    // for each pod create the new pod
    for (const deploy of deployModels) {
      await createPodToSpecificNode(apiK8sClient, appsApiK8sClient, deploy);
    }
  } catch (error: unknown) {
    logger.error(error);
  }
};

const createPodToSpecificNode = async (
  apiK8sClient: k8s.CoreV1Api,
  appsApiK8sClient: k8s.AppsV1Api,
  deploy: DeploymentPlacementModel
) => {
  const { node, deploymentName, namespace } = deploy;

  const deployName = deploymentName;

  const taint = k8sMapper.toNodeTaints(deploy);

  // taint nodes
  await addTaint(apiK8sClient, node, taint);

  // create new pod
  await handleDeployReplicas(appsApiK8sClient, deployName, namespace, 'add');

  // delete taints from nodes
  const taintKey = taint.key;
  await deleteTaint(apiK8sClient, taintKey);

  // after delete a taint wait a pod for 10 seconds to be app and running and after delete a pod from another node
  // wait until all replica pods of the deployment are READY
  // if these pods are not ready after 10 seconds add them in a queue and retry until them to be READY
  // if a new round of reschedule begin do not count them
  const maxRound = 10; // maxRounds

  const ready = await readyStatusDeploy(
    appsApiK8sClient,
    deployName,
    namespace,
    maxRound
  );

  if (!ready) {
    logger.error(`Pods for deployment ${deploymentName} are not ready`);
    const deployParser = k8sMapper.toDeployStore(deploy);

    // Fire-and-forget with concurrency control
    (async () => {
      await semaphore.acquire(); // Wait for a slot to be available
      try {
        await retryUntilReadyStatusDeploy(deployParser, true);
      } finally {
        semaphore.release(); // Release the slot
      }
    })();

    return;
  }

  // delete a pod from a specific node
  await deletePod(apiK8sClient, deploy.deletePod, namespace);

  // decrease replicas
  await handleDeployReplicas(appsApiK8sClient, deployName, namespace, 'delete');
};

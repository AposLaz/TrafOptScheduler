/*
import { logger } from '../config/logger';
import { k8sMapper } from '../mapper/k8s.mapper';
import { DeploymentPlacementModel } from '../types';
import {
  handleDeployReplicas,
  readyStatusDeploy,
} from './k8s/adapters/k8s.deploy.service';
import { addTaint, deleteTaint } from './k8s/adapters/k8s.node.service';
import { deletePod } from './k8s/adapters/k8s.pod.service';
import * as k8s from '@kubernetes/client-node';
import { retryUntilReadyStatusDeploy } from './queue.notReadyPods.service';
import { Semaphore } from '../handler/semaphore.handler';
import { SemaphoreConcLimits } from '../enums';

// Initialize the semaphore with the desired concurrency limit
const semaphore = Semaphore.getInstance(SemaphoreConcLimits.MAX_CONCURRENCY); // Get the singleton instance with a max of default 20 concurrent tasks

export const scheduler = async (
  apiK8sClient: k8s.CoreV1Api,
  appsApiK8sClient: k8s.AppsV1Api,
  deployModels: DeploymentPlacementModel[]
) => {
  try {
    // for each pod create the new pod
    for (const deploy of deployModels) {
      const { nodes, deploymentName, namespace } = deploy;

      const deployName = deploymentName;

      const taint = k8sMapper.toNodeTaints(deploy);

      // taint nodes
      await addTaint(apiK8sClient, nodes, taint);

      // create new pod
      await handleDeployReplicas(
        appsApiK8sClient,
        deployName,
        namespace,
        'add'
      );

      // delete taints from nodes
      const taintKey = taint.key;
      await deleteTaint(apiK8sClient, nodes, taintKey);

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
        const deployParser = k8sMapper.toDeploymentStore(deploy);

        // Fire-and-forget with concurrency control
        (async () => {
          await semaphore.acquire(); // Wait for a slot to be available
          try {
            await retryUntilReadyStatusDeploy(deployParser, true);
          } finally {
            semaphore.release(); // Release the slot
          }
        })();

        continue;
      }

      // delete a pod from a specific node
      await deletePod(apiK8sClient, deploy.deletePod, namespace);

      // decrease replicas
      await handleDeployReplicas(
        appsApiK8sClient,
        deployName,
        namespace,
        'delete'
      );
    }
  } catch (error: unknown) {
    logger.error(error);
  }
};
*/

/*

import { queueApi } from '../api/queue.filesystem.api';
import { logger } from '../config/logger';
import { SemaphoreConcLimits } from '../enums';
import { Semaphore } from '../handler/semaphore.handler';
import { DeploymentNotReadyFilesystem } from '../types';
import {
  getAppsApiClient,
  getCoreApiClient,
} from './k8s/adapters/k8s.client.service';
import {
  handleDeployReplicas,
  readyStatusDeploy,
} from './k8s/adapters/k8s.deploy.service';
import { deletePod } from './k8s/adapters/k8s.pod.service';

const semaphore = Semaphore.getInstance(SemaphoreConcLimits.MAX_CONCURRENCY); // Get the singleton instance with a max of default 20 concurrent tasks

export const checkNotReadyPodsInQueue = () => {
  return new Promise(() => {
    // read data from the file
    const data = queueApi.readQueueFile();

    // decode json data to the right format
    const queueData: DeploymentNotReadyFilesystem[] = JSON.parse(data);
    logger.info(`Deployment queue length: ${queueData.length}`);

    for (const deploy of queueData) {
      // Fire-and-forget with concurrency control
      (async () => {
        await semaphore.acquire(); // Wait for a slot to be available
        try {
          await retryUntilReadyStatusDeploy(deploy, false);
        } finally {
          semaphore.release(); // Release the slot
        }
      })();
    }
  });
};

// retry until all deployments are ready or when a new cronjob runs
export const retryUntilReadyStatusDeploy = async (
  deploy: DeploymentNotReadyFilesystem,
  write: boolean
) => {
  const appsApiK8sClient = getAppsApiClient();
  const apiK8sClient = getCoreApiClient();

  logger.info(
    `[INFO] ******** Retry until ready status deploy: ${deploy.deploymentName} ********`
  );

  // write deploy from the file
  if (write) {
    logger.info(`Write deploy to the file: ${deploy.deploymentName}`);
    // write deploy from the file
    queueApi.writeDeployToQueueFile(deploy);
  }

  const maxRound = 1000; // 1000 seconds

  const ready = await readyStatusDeploy(
    appsApiK8sClient,
    deploy.deploymentName,
    deploy.namespace,
    maxRound
  );

  if (!ready) {
    logger.error(`Pods for deployment ${deploy.deploymentName} are not ready`);
    return;
  }

  // delete a pod from a specific node
  await deletePod(apiK8sClient, deploy.deletePod, deploy.namespace);

  // decrease replicas
  await handleDeployReplicas(
    appsApiK8sClient,
    deploy.deploymentName,
    deploy.namespace,
    'delete'
  );

  logger.info(`Delete deploy from the file: ${deploy.deploymentName}`);
  // delete deploy from the file
  queueApi.deleteDeployFromQueueFile(deploy);
};
*/

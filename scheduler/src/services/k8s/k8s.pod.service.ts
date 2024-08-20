import * as k8s from '@kubernetes/client-node';
import { logger } from '../../config/logger';

export const getPodsByLabels = async (
  k8sClient: k8s.CoreV1Api,
  namespace: string,
  label: string
) => {
  const pods = await k8sClient.listNamespacedPod(
    namespace,
    undefined,
    undefined,
    undefined,
    undefined,
    label
  );

  if (pods.body.items.length === 0) return;

  return pods.body.items;
};

export const deletePod = async (
  k8sClient: k8s.CoreV1Api,
  podName: string,
  ns: string
) => {
  logger.info(`Deleting pod ${podName} from namespace ${ns}`);
  await k8sClient.deleteNamespacedPod(podName, ns);
};

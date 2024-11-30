import * as k8s from '@kubernetes/client-node';

//import { getMetricsClient } from '../k8s/adapters/k8s.client.service';
import { k8sMapper } from '../../k8s/mapper';

export const getPodsCurrentResources = async (
  k8sClient: k8s.CoreV1Api,
  namespace: string
) => {
  //const metricsClient = getMetricsClient();
  // const topPods = await k8s.topPods(k8sClient, metricsClient, namespace);
  // const podsResources = k8sMapper.toPodResources(topPods);
  // return podsResources;
};

export const getNodesResources = async (k8sClient: k8s.CoreV1Api) => {
  const topNodes = await k8s.topNodes(k8sClient);

  const nodeResources = k8sMapper.toNodeResources(topNodes);

  return nodeResources;
};

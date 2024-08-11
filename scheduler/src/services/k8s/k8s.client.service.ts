import { getK8sClient } from '../../config/k8sClient';
import * as k8s from '@kubernetes/client-node';

export const getAppsApiClient = () => {
  const k8sClient = getK8sClient();
  return k8sClient.makeApiClient(k8s.AppsV1Api);
};

export const getCoreApiClient = () => {
  const k8sClient = getK8sClient();
  return k8sClient.makeApiClient(k8s.CoreV1Api);
};

let metricsClientInstance: k8s.Metrics | null = null;

export const getMetricsClient = () => {
  if (!metricsClientInstance) {
    const k8sClient = getK8sClient();
    metricsClientInstance = new k8s.Metrics(k8sClient);
  }
  return metricsClientInstance;
};

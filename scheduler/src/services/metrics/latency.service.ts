import prometheusApi from '../../api/prometheus.api';
import { Config } from '../../config/config';
import { logger } from '../../config/logger';
import { getSvc } from '../k8s/k8s.svc.service';
import * as k8s from '@kubernetes/client-node';

export const appsLatency = async (
  k8sClient: k8s.CoreV1Api,
  namespace: string
) => {
  const promSVC = await getSvc(
    k8sClient,
    Config.PROMETHEUS_SVC,
    Config.PROMETHEUS_NAMESPACE
  );
  console.log(promSVC);
  const port = promSVC.ports!.find((p) => p.name === 'http');

  const prometheusUrl =
    Config.ENV === 'production'
      ? `${promSVC.clusterIp}:${port!.port}`
      : `${promSVC.externalIp![0].ip}:${port!.port}`;

  const latency = prometheusApi.getLatencyBetweenPods(prometheusUrl, namespace);

  if (!latency) {
    logger.error(`Error getting latency for pods in namespace: ${namespace}`);
  }
  return latency;
};

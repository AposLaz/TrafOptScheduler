import prometheusApi from '../../api/prometheus.api';
import { Config } from '../../config/config';
import { logger } from '../../config/logger';
import { getSvc } from '../../k8s/services/svc.service';
import * as k8s from '@kubernetes/client-node';

export const appsResponseTime = async (
  k8sClient: k8s.CoreV1Api,
  namespace: string
) => {
  const promSVC = await getSvc(
    k8sClient,
    Config.PROMETHEUS_SVC,
    Config.PROMETHEUS_NAMESPACE
  );

  const port = promSVC.ports!.find((p) => p.name === 'http');

  const prometheusUrl =
    Config.ENV === 'production'
      ? `${promSVC.clusterIp}:${port!.port}`
      : `${promSVC.externalIp![0].ip}:${port!.port}`;

  const rs = prometheusApi.getResponseTimeBetweenPods(prometheusUrl, namespace);

  if (!rs) {
    logger.error(
      `Error getting response time for pods in namespace: ${namespace}`
    );
  }
  return rs;
};

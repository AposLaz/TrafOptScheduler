import type * as k8s from '@kubernetes/client-node';

export const getSvc = async (
  k8sClient: k8s.CoreV1Api,
  service: string,
  namespace: string
) => {
  const svc = await k8sClient.readNamespacedService(service, namespace);
  return {
    clusterIp: svc.body.spec?.clusterIP,
    externalIp: svc.body.status?.loadBalancer?.ingress,
    ports: svc.body.spec?.ports,
  };
};

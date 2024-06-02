import kubernetesApi from '../api/k8s/kubernetesApi';
import { SetupGkeConfigs } from '../types';

export const gkeSetupConfigs = async (): Promise<SetupGkeConfigs> => {
  const istioIP = await kubernetesApi.getExternalIpBySvc(
    'istio-ingressgateway',
    'istio-system'
  );

  if (!istioIP) {
    throw new Error("[gkeSetupConfigs]=> Can't fetch istio exteranl ip");
  }

  const kialiIP = await kubernetesApi.getExternalIpBySvc(
    'kiali',
    'istio-system'
  );

  if (!kialiIP)
    throw new Error("[gkeSetupConfigs]=> Can't fetch kiali exteranl ip");
  return {
    istioIP,
    kialiIP,
  };
};

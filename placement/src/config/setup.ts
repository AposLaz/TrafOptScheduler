import kubernetesApi from '../api/k8s/kubernetesApi';
import { SetupGkeConfigs } from '../types';

export const gkeSetupConfigs = async (): Promise<SetupGkeConfigs> => {
  const istioIP = await kubernetesApi.getExternalIpBySvc(
    'istio-ingressgateway',
    'istio-system'
  );

  if (!istioIP) {
    throw new Error("[gkeSetupConfigs]=> Can't fetch istio external ip");
  }

  const kialiIP = await kubernetesApi.getExternalIpBySvc(
    'kiali',
    'istio-system'
  );

  if (!kialiIP) {
    throw new Error("[gkeSetupConfigs]=> Can't fetch kiali external ip");
  }

  const prometheusIP = await kubernetesApi.getExternalIpBySvc(
    'prometheus',
    'istio-system'
  );

  if (!prometheusIP) {
    throw new Error("[gkeSetupConfigs]=> Can't fetch prometheus external ip");
  }

  return {
    istioIP,
    kialiIP,
    prometheusIP,
  };
};

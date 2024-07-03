import kubernetesApi from '../api/k8s/kubernetesApi';
import { SetupGkeConfigs } from '../types';

/**
 * Must make Auto Discovery for ip and port for each service
 *
 * Because it will going to run locally as a service have to use cluster ip
 *
 * TODO => use cluster ip
 * @returns
 */

export const gkeSetupConfigs = async (): Promise<SetupGkeConfigs> => {
  const istioIP = await kubernetesApi.getExternalIpBySvc(
    'istio-ingressgateway',
    'istio-system'
  );

  if (!istioIP) {
    throw new Error("[gkeSetupConfigs]=> Can't fetch istio external ip");
  }

  const istioPort = await kubernetesApi.getPortBySvc(
    'istio-ingressgateway',
    'istio-system'
  );

  if (!istioPort) {
    throw new Error("[gkeSetupConfigs]=> Can't fetch istio port");
  }

  const kialiIP = await kubernetesApi.getExternalIpBySvc(
    'kiali',
    'istio-system'
  );

  if (!kialiIP) {
    throw new Error("[gkeSetupConfigs]=> Can't fetch kiali external ip");
  }

  const kialiPort = await kubernetesApi.getPortBySvc('kiali', 'istio-system');

  if (!kialiPort) {
    throw new Error("[gkeSetupConfigs]=> Can't fetch kiali port");
  }

  const prometheusIP = await kubernetesApi.getExternalIpBySvc(
    'prometheus',
    'istio-system'
  );

  if (!prometheusIP) {
    throw new Error("[gkeSetupConfigs]=> Can't fetch prometheus external ip");
  }

  const prometheusPort = await kubernetesApi.getPortBySvc(
    'prometheus',
    'istio-system'
  );

  if (!prometheusPort) {
    throw new Error("[gkeSetupConfigs]=> Can't fetch prometheus port");
  }

  return {
    istioHost: `${istioIP}:${istioPort}`,
    kialiHost: `${kialiIP}:${kialiPort}`,
    prometheusHost: `${prometheusIP}:${prometheusPort}`,
  };
};

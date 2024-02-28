import kubernetesApi from "../api/k8s/kubernetesApi";
import { SetupGkeConfigs } from "../types";

export const gkeSetupConfigs = async (): Promise<SetupGkeConfigs> => {
  const istioIP = await kubernetesApi.getIstioExternalIp();

  if (!istioIP)
    throw new Error("[gkeSetupConfigs]=> Can't fetch istio exteranl ip");

  return {
    istioIP,
  };
};

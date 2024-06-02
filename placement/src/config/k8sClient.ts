import * as k8s from '@kubernetes/client-node';

// use Singleton Pattern
class K8sClientConfig {
  private static instance: k8s.KubeConfig;

  private constructor() {}

  public static getInstance(): k8s.KubeConfig {
    if (!K8sClientConfig.instance) {
      K8sClientConfig.instance = new k8s.KubeConfig();
      K8sClientConfig.instance.loadFromCluster(); // in-cluster loadFromCluster()
    }
    return K8sClientConfig.instance;
  }
}

export const getK8sClient = () => {
  try {
    const kc = K8sClientConfig.getInstance();

    return kc;
  } catch (error: unknown) {
    const err = error as Error;
    throw new Error(
      `[ERROR] Could not setup k8s client: \n******************************************* \n${err} \n*******************************************`
    );
  }
};

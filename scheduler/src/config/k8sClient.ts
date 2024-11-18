import * as k8s from '@kubernetes/client-node';
import { Config } from './config';

// use Singleton Pattern
class K8sClientConfig {
  private static instance: k8s.KubeConfig;

  private constructor() {}

  public static getInstance(): k8s.KubeConfig {
    if (!K8sClientConfig.instance) {
      K8sClientConfig.instance = new k8s.KubeConfig();

      // choose client based on environment
      Config.ENV === 'production'
        ? K8sClientConfig.instance.loadFromCluster() // runs in the Cluster
        : K8sClientConfig.instance.loadFromDefault(); // runs in development mode
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

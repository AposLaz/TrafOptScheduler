import * as k8s from "@kubernetes/client-node";

export type PodWatcherConfigs = {
  k8sClient: k8s.KubeConfig;
  startTime: string;
  k8sApi: k8s.CoreV1Api;
};

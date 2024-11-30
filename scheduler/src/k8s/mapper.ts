import { TaintEffects } from '../enums';
import * as k8s from '@kubernetes/client-node';
import {
  DeploymentNotReadyFilesystem,
  DeploymentPlacementModel,
} from '../types';
import { NodeMetrics, PodMetrics } from './types';
import { convertResourcesStringToNumber } from '../common/helpers';

const k8sMapper = {
  toNamespace: (
    ns: string,
    labels?: { [key: string]: string }
  ): k8s.V1Namespace => ({
    metadata: {
      name: ns,
      labels: {
        ...labels,
      },
    },
  }),
  toNodeTaints: (taintDeploy: DeploymentPlacementModel): k8s.V1Taint => ({
    key: taintDeploy.deploymentName, // key is the pod name
    effect: TaintEffects.NO_SCHEDULE,
  }),
  toDeployStore: (
    deployment: DeploymentPlacementModel
  ): DeploymentNotReadyFilesystem => ({
    deploymentName: deployment.deploymentName, // key is the pod name
    namespace: deployment.namespace,
    deletePod: deployment.deletePod,
  }),
  toPodResources: (pods: k8s.PodStatus[]): PodMetrics[] => {
    // CPU to milicores & RAM to MB
    return pods.map((pod) => {
      return {
        namespace: pod.Pod.metadata!.namespace as string,
        node: pod.Pod.spec!.nodeName as string,
        podName: pod.Pod.metadata!.name as string,
        usage: {
          cpu: Number(pod.CPU.CurrentUsage) * 1000,
          memory: Number(pod.Memory.CurrentUsage) / (1024 * 1024),
        },
        requested: {
          cpu: Number(pod.CPU.RequestTotal) * 1000,
          memory: Number(pod.Memory.RequestTotal) / (1024 * 1024),
        },
        limits: {
          cpu: Number(pod.CPU.LimitTotal) * 1000,
          memory: Number(pod.Memory.LimitTotal) / (1024 * 1024),
        },
      };
    });
  },
  toNodeResources: (nodes: k8s.NodeStatus[]): NodeMetrics[] => {
    // CPU to milicores & RAM to MB
    return nodes.map((node) => {
      return {
        name: node.Node.metadata!.name as string,
        capacity: {
          cpu: Number(node.CPU.Capacity) * 1000,
          memory: Number(node.Memory.Capacity) / (1024 * 1024),
        },
        //Allocatable represents the resources of a node that are available for scheduling. Defaults to Capacity.
        allocatable: {
          cpu: convertResourcesStringToNumber(
            node.Node.status!.allocatable!.cpu
          ),
          memory:
            convertResourcesStringToNumber(
              node.Node.status!.allocatable!.memory
            ) / 1024,
        },
        requested: {
          cpu: Number(node.CPU.RequestTotal) * 1000,
          memory: Number(node.Memory.RequestTotal) / (1024 * 1024),
        },
        limits: {
          cpu: Number(node.CPU.LimitTotal) * 1000,
          memory: Number(node.Memory.LimitTotal) / (1024 * 1024),
        },
      };
    });
  },
};

export { k8sMapper };

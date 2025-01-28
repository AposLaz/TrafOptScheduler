import { cnUtils } from './utils';

import type { NodeMetrics } from '../../k8s/types';
import type { DeploymentSingleRs } from '../../types';

export const getCandidateNodeByLFU = (
  pod: DeploymentSingleRs,
  nodes: NodeMetrics[]
): string => {
  const weightNodes = nodes
    .map((node) => {
      const normalizedCPU = node.requested.cpu / node.allocatable.cpu;
      const normalizedMemory = node.requested.memory / node.allocatable.memory;

      return {
        name: node.name,
        score: normalizedCPU * 0.5 + normalizedMemory * 0.5,
      };
    })
    .sort((a, b) => a.score - b.score); // select the node with the lowest score

  // if possible remove the node that the pod is already located.
  if (weightNodes.length > 1) {
    return cnUtils.removeNodeForCriticalPod(weightNodes, pod.pods.node);
  }
  // return the first node
  return weightNodes[0].name;
};

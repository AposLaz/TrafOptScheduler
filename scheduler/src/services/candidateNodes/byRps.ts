import { cnUtils } from './utils';

import type { GraphDataRps } from '../../prometheus/types';
import type { DeploymentSingleRs } from '../../types';

export const getCandidateNodeByRps = (
  pod: DeploymentSingleRs,
  graph: GraphDataRps[]
) => {
  // Get the sum of rps per node
  const perNodeRps = cnUtils.nodeSumRps(graph);

  // Get the total sum of rps of all nodes
  const totalNodesRps = perNodeRps.reduce(
    (nodeRps, node) => nodeRps + node.rps,
    0
  );

  // Get the nodes sorted by highest normalized weight
  const weightNodes = cnUtils.normalizedWeightNodesByRps(
    perNodeRps,
    totalNodesRps
  );

  // if possible remove the node that the pod is already located.
  return cnUtils.removeNodeForCriticalPod(weightNodes, pod.pods.node);
};

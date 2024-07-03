/**
 * Try to scheduling communities to nodes that are more loaded by cpu and ram
 */

import { clusterResources } from './metrics/clusterResources';

/**
 * Accept communities of modsoft and nodes
 */

/**
 * Almost all deployments have replicas. If number of deployments replicas is > 1
 * then find affinity for each partition in community and calculate the node affinity between these two pods
 */

/**
 * Before scheduling add annotations that says that these services are scheduled so to not scheduled them again
 */

export const binPacking = async () => {
  const clResources = await clusterResources();
  console.log(clResources);
};

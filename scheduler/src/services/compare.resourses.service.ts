import {
  getNodesResources,
  getPodsCurrentResources,
} from './metrics/cpu.ram.resources.service';
import * as k8s from '@kubernetes/client-node';
import { logger } from '../config/logger';
import { deploymentMatchLabels } from './k8s/k8s.deploy.service';
import { getPodsByLabels } from './k8s/k8s.pod.service';
import {
  DeploymentLabels,
  DeploymentReplicasData,
  ObjectStrings,
} from '../types';
import { appsResponseTime } from './metrics/responseTime.service';

export const reschedulePods = async (
  apiK8sClient: k8s.CoreV1Api,
  appsApiK8sClient: k8s.AppsV1Api,
  namespace: string
) => {
  // const pods = await getPodsCurrentResources(apiK8sClient, namespace);
  // const nodes = await getNodesResources(apiK8sClient);

  /************** Response Time **************/
  const responseTime = await appsResponseTime(apiK8sClient, namespace);
  if (!responseTime) return;

  // descending order response time
  const sortResponseTime = responseTime.sort((a, b) => b.metric - a.metric);
  console.log(sortResponseTime);

  // We want from source service, to find the source replica pods and their node, so that to identify how many replica pods are running on a node
  //  I want to move downstream pods in the same node as the biggest number of replica pods
  // If are current in the same node, don't do anything
  // get distinct sources because there is not other way to identify the upstream replica pods of a node

  const distinctSources = [...new Set(responseTime.map((rs) => rs.source))];

  const sourceReplicaPodsNode = await fetchSourceReplicaPodsNode(
    apiK8sClient,
    appsApiK8sClient,
    namespace,
    distinctSources
  );

  console.log(sourceReplicaPodsNode);
};

/**
 * Fetches the source replica pods and their nodes for each distinct source deployment.
 * @param apiK8sClient - The Kubernetes API client for core API operations.
 * @param appsApiK8sClient - The Kubernetes API client for apps API operations.
 * @param namespace - The namespace to fetch the deployment labels from.
 * @param sourcePods - The list of distinct source deployments.
 * @returns An array of DeploymentReplicasData objects, each containing the source deployment
 * information, the number of replica pods, and their nodes.
 */
const fetchSourceReplicaPodsNode = async (
  apiK8sClient: k8s.CoreV1Api,
  appsApiK8sClient: k8s.AppsV1Api,
  namespace: string,
  sourcePods: string[]
): Promise<DeploymentReplicasData[]> => {
  // Array to store the source deployment labels.
  const sourceDeploymentLabels: DeploymentLabels[] = [];

  // Loop through each distinct source deployment and get matching labels.
  for (const source of sourcePods) {
    // Get the matching labels for the source deployment.
    const sourceDeployments = await deploymentMatchLabels(
      appsApiK8sClient,
      source,
      namespace
    );

    // If no matching labels are found, log an error and continue to the next iteration.
    if (!sourceDeployments) {
      logger.error(
        `Error getting matching deployment ${source} for labels in namespace: ${namespace}`
      );
      continue;
    }

    // Push the source deployment and its matching labels to the sourceDeploymentLabels array.
    sourceDeploymentLabels.push({
      deployment: source,
      matchLabels: sourceDeployments,
    });
  }

  // Array to store the source deployment information, the number of replica pods, and their nodes. currently supports only the (APP) label
  const sourceDeploymentRsData: DeploymentReplicasData[] = [];

  // Loop through each source deployment and its matching labels.
  for (const source of sourceDeploymentLabels) {
    // Construct the label to fetch the replica pods.
    const label = `app=${source.matchLabels.app}`;

    // Fetch the replica pods using the label.
    const replicas = await getPodsByLabels(apiK8sClient, namespace, label);

    // If no replica pods are found, log an error.
    if (!replicas) {
      logger.error(
        `No matching labels ${label} for deployment ${source.deployment}`
      );
    }

    // Map over the replica pods to extract their names and nodes.
    const replicasData = replicas!.map((p) => {
      return {
        name: p.metadata!.name as string,
        node: p.spec!.nodeName as string,
      };
    });

    // Create an object to store the replica pods grouped by node.
    const nodePodsMap: ObjectStrings = {};

    // Loop through each replica pod and add it to the appropriate node group.
    replicasData.forEach((p) => {
      if (!nodePodsMap[p.node]) {
        nodePodsMap[p.node] = [];
      }
      nodePodsMap[p.node].push(p.name);
    });

    // Map over the nodePodsMap object to create an array of NodePodsMap objects.
    const nodePods = Object.entries(nodePodsMap).map(([name, pods]) => ({
      name,
      pods,
    }));

    // Push the source deployment information, the number of replica pods, and their nodes to the sourceDeploymentRsData array.
    sourceDeploymentRsData.push({
      ...source,
      nodes: nodePods,
      replicasNum: replicas!.length,
    });
  }

  // Return the array of source deployment information, the number of replica pods, and their nodes.
  return sourceDeploymentRsData;
};

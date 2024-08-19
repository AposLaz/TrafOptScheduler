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
  DeploymentPlacementModel,
  DeploymentReplicasData,
  ObjectStrings,
} from '../types';
import { appsResponseTime } from './metrics/responseTime.service';
import { Config } from '../config/config';

// return pods and the node for reschedule
export const findReschedulePods = async (
  apiK8sClient: k8s.CoreV1Api,
  appsApiK8sClient: k8s.AppsV1Api,
  namespace: string
): Promise<DeploymentPlacementModel[] | undefined> => {
  const podsResources = await getPodsCurrentResources(apiK8sClient, namespace);
  const nodesResources = await getNodesResources(apiK8sClient);

  /************** Response Time **************/
  const responseTime = await appsResponseTime(apiK8sClient, namespace);
  if (!responseTime) return;

  // descending order response time
  const sortResponseTime = responseTime.sort((a, b) => b.metric - a.metric);

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

  // for each downstream replica pod check its where should rescheduled
  // a pod will be rescheduled in a node with the most upstream pods **IN THIS LOOP IDENTIFY THIS NODE**
  // if upstream pods are equal distributed then downstream pod will stay in the same node
  // in this step we must create a new replica pod
  // if a pod is **MARKED** as rescheduled, first we will check if exists resources on the **TARGET NODE**
  // if not exists resources on the **TARGET NODE**, then we will try remove a pod with small amount of response time and MAX(cpu_usage,cpu_requested) & MAX(ram_usage,ram_requested)
  // and we will reschedule this pod first in another node & after we will reschedule the **MARKED** pod.
  const highRtPods = sortResponseTime.filter(
    (pod) => pod.metric > Config.RESPONSE_TIME_THRESHOLD
  );

  if (highRtPods.length === 0) return;

  // get all nodes names
  const nodeNames = nodesResources.map((node) => node.name);

  // in this array store all pods info that will be rescheduled
  const replacementPods: DeploymentPlacementModel[] = [];

  for (const dmPod of highRtPods) {
    // find upstream replica pods of the destination pod
    const sourceUpstreamPod = sourceReplicaPodsNode.find(
      (umPod) => umPod.deployment === dmPod.source
    );

    if (!sourceUpstreamPod) {
      continue;
    }

    // find the pod resources
    const dtPodResources = podsResources.find(
      (pod) => pod.podName === dmPod.replicaPod
    );

    if (!dtPodResources) {
      continue;
    }

    // get pod cpu and ram
    const cpuPodUsage = dtPodResources.usage.cpu;
    const cpuPodRequested = dtPodResources.requested.cpu;

    const ramPodUsage = dtPodResources.usage.memory;
    const ramPodRequested = dtPodResources.requested.memory;

    const maxPodCpu = Math.max(cpuPodUsage, cpuPodRequested);
    const maxPodRam = Math.max(ramPodUsage, ramPodRequested);

    // find replica pods in the current node
    const candidatePodNode = sourceUpstreamPod.nodes.find(
      (node) => node.name === dmPod.node
    );
    if (!candidatePodNode) {
      continue;
    }
    // init candidate node
    const candidateNode = {
      node: dmPod.node,
      rs: candidatePodNode.pods.length,
    };

    const weightConst = 0.5;

    sourceUpstreamPod.nodes.forEach((node) => {
      if (
        node.pods.length > candidateNode.rs &&
        node.name !== candidateNode.node
      ) {
        candidateNode.node = node.name;
        candidateNode.rs = node.pods.length;
      }

      if (
        node.pods.length === candidateNode.rs &&
        node.name !== candidateNode.node
      ) {
        // check which one has the least available resources (Apply LFU), but resources must be sufficient
        // get nodes resources
        // if not sufficient, then select the one with the most available resources
        // check node available resources
        // check pod Max(cpu/ram_usage,cpu/ram_requested)
        const c1Node = nodesResources.find(
          (n) => n.name === candidateNode.node
        );

        const c2Node = nodesResources.find((n) => n.name === node.name);

        if (!c1Node || !c2Node) {
          return;
        }

        // find if nodes have available cpu
        const c1CpuAvailable = c1Node.allocatable.cpu - c1Node.requested.cpu;
        const c2CpuAvailable = c2Node.allocatable.cpu - c2Node.requested.cpu;

        // find if nodes have available ram
        const c1RamAvailable =
          c1Node.allocatable.memory - c1Node.requested.memory;
        const c2RamAvailable =
          c2Node.allocatable.memory - c2Node.requested.memory;

        // check if c2Node has available resources
        const c2Available =
          c2CpuAvailable - maxPodCpu > 0 && c2RamAvailable - maxPodRam > 0;

        // if c2Node has available resources then calculate best scheduling node base of (LFU)
        if (c2Available) {
          const c1Weight =
            weightConst * (maxPodCpu / c1CpuAvailable) +
            weightConst * (maxPodRam / c1RamAvailable);

          const c2Weight =
            weightConst * (maxPodCpu / c2CpuAvailable) +
            weightConst * (maxPodRam / c2RamAvailable);

          if (c1Weight < c2Weight) {
            candidateNode.node = node.name;
            candidateNode.rs = node.pods.length;
          }
        }
      }
    });

    // TODO CHECK IF CANDIDATE NODE HAS AVAILABLE RESOURCES. OTHER MAKE AN EXCHANGE

    replacementPods.push({
      deploymentName: dmPod.target,
      nodes: nodeNames.filter((node) => node !== candidateNode.node), // taint these nodes except candidate node
      namespace: namespace,
      deletePod: dmPod.replicaPod,
    });
  }

  return replacementPods;
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
    });
  }

  // Return the array of source deployment information, the number of replica pods, and their nodes.
  return sourceDeploymentRsData;
};

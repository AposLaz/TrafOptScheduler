import {
  getNodesResources,
  getPodsCurrentResources,
} from './metrics/cpu.memory.resources.service';
import * as k8s from '@kubernetes/client-node';
import { logger } from '../config/logger';
import { deploymentMatchLabels } from './k8s/deploy.service';
import { getPodsByLabels } from './k8s/pod.service';
import {
  CandidateAndCurrentNodes,
  CandidateReschedulingPods,
  DeploymentLabels,
  DeploymentPlacementModel,
  DeploymentReplicasData,
  MapResourcesNode,
  NodeMetrics,
  ObjectResources,
  ObjectStrings,
  PrometheusTransformResultsToIstioMetrics,
} from '../types';
import { appsResponseTime } from './metrics/responseTime.service';
import { Config } from '../config/config';

// return pods and the node for reschedule
export const findReschedulePods = async (
  apiK8sClient: k8s.CoreV1Api,
  appsApiK8sClient: k8s.AppsV1Api,
  namespace: string
): Promise<DeploymentPlacementModel[] | undefined> => {
  // get pods and node resources for specific namespace
  const podsResources = await getPodsCurrentResources(apiK8sClient, namespace);
  const nodesResources = await getNodesResources(apiK8sClient);

  // get response time
  const responseTime = await appsResponseTime(apiK8sClient, namespace);
  if (!responseTime) {
    logger.warn(`No response time found in namespace: ${namespace}`);
    return;
  }

  //filter response time that exceed the threshold
  const highRtPods = responseTime.filter(
    (pod) => pod.metric > Config.RESPONSE_TIME_THRESHOLD
  );

  ///********************************************************* DUMMY DATA */
  highRtPods.push({
    node: 'gke-cluster-0-default-pool-aec86d71-cd4d',
    source: 'checkoutservice',
    target: 'paymentservice',
    replicaPod: 'paymentservice-55646bb857-jkzgx',
    metric: 7.89,
  });
  //****************************************************** */

  if (highRtPods.length === 0) {
    logger.info(`No high response time found in namespace: ${namespace}`);
    return;
  }

  // keep only only one copy of dm replica pods, this one with the highest response time
  const uniqueDmRsPods = Object.values(
    highRtPods.reduce<Record<string, PrometheusTransformResultsToIstioMetrics>>(
      (acc, obj) => {
        if (!acc[obj.replicaPod] || acc[obj.replicaPod].metric < obj.metric) {
          acc[obj.replicaPod] = obj;
        }
        return acc;
      },
      {}
    )
  );

  // descending order response time
  const sortResponseTime = uniqueDmRsPods.sort((a, b) => b.metric - a.metric);
  console.log('*****************SORTED RESPONSE TIME*******************');
  console.log(sortResponseTime);
  // We want from source service, to find the source replica pods and their node, so that to identify how many replica pods are running on a node
  // I want to move downstream pods in the same node as the biggest number of replica pods
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

  // get all nodes names
  const nodeNames = nodesResources.map((node) => node.name);

  // in this array store all pods info that will be marked as rescheduled
  const replacementPods: CandidateReschedulingPods[] = [];

  for (const dmPod of sortResponseTime) {
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

    // get pod cpu and memory
    const cpuPodUsage = dtPodResources.usage.cpu;
    const cpuPodRequested = dtPodResources.requested.cpu;

    const memoryPodUsage = dtPodResources.usage.memory;
    const memoryPodRequested = dtPodResources.requested.memory;

    const maxPodCpu = Math.max(cpuPodUsage, cpuPodRequested);
    const maxPodMemory = Math.max(memoryPodUsage, memoryPodRequested);

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

    // for each node find the number of upstream replica pods
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
        const c1MemoryAvailable =
          c1Node.allocatable.memory - c1Node.requested.memory;
        const c2MemoryAvailable =
          c2Node.allocatable.memory - c2Node.requested.memory;

        // check if c2Node has available resources
        const c2Available =
          c2CpuAvailable - maxPodCpu > 50 &&
          c2MemoryAvailable - maxPodMemory > 50;

        // if c2Node has available resources then calculate best scheduling node base of (LFU)
        if (c2Available) {
          const c1Weight =
            weightConst * (maxPodCpu / c1CpuAvailable) +
            weightConst * (maxPodMemory / c1MemoryAvailable);

          const c2Weight =
            weightConst * (maxPodCpu / c2CpuAvailable) +
            weightConst * (maxPodMemory / c2MemoryAvailable);

          if (c1Weight < c2Weight) {
            candidateNode.node = node.name;
            candidateNode.rs = node.pods.length;
          }
        }
      }
    });

    // if the candidate node is the same as the current node then continue. Pod is in the ideal node. May need a new replica
    if (dmPod.node === candidateNode.node) continue;

    replacementPods.push({
      deploymentName: dmPod.target,
      nodes: nodeNames.filter((node) => node !== candidateNode.node), // taint these nodes except candidate node
      namespace: namespace,
      deletePod: dmPod.replicaPod,
      candidateNode: candidateNode.node,
      currentNode: dmPod.node,
      maxPodCpu: maxPodCpu,
      maxPodMemory: maxPodMemory,
    });
  }

  // sum resources of all replica pods per node and check if all of them can be rescheduled in the destination nodes
  // if neither can. And also in their node does not exists resources then continue and log the message.

  // find unique candidate nodes
  const uniqueCandidateNodes = [
    ...new Set(replacementPods.map((pod) => pod.candidateNode)),
  ];

  const candNodesAvailResources: MapResourcesNode[] =
    getNodesAvailableResources(uniqueCandidateNodes, nodesResources);

  // nodes that replica pods already located
  const uniqueCurrentNodes = [
    ...new Set(replacementPods.map((pod) => pod.currentNode)),
  ];

  const currentNodesAvailResources: MapResourcesNode[] =
    getNodesAvailableResources(uniqueCurrentNodes, nodesResources);

  //first sum all scheduling pod resources that have the same candidate node in the same node

  console.log(candNodesAvailResources);
  const sumPodResources = sumCpuAndMemoryByNode(replacementPods);

  // all the pods of the current node can be scheduled to the candidate node
  const nodeOfPodsThatCanBeRescheduledToTheCandidateNode: CandidateAndCurrentNodes[] =
    [];

  // for each candidate node of pod resources, find if exists a current node that can schedule all its pods there
  for (const node in sumPodResources) {
    const getCandNode = candNodesAvailResources.find((n) => n.name === node);
    if (!getCandNode) continue;

    // for all pods in each current node check if the resources are sufficient for rescheduling
    sumPodResources[node].forEach((pod) => {
      if (
        getCandNode.cpu - pod.totalCpu > 0 &&
        getCandNode.memory - pod.totalMemory > 0
      ) {
        nodeOfPodsThatCanBeRescheduledToTheCandidateNode.push({
          currentNode: pod.currentNode,
          candidateNode: getCandNode.name,
        });
      }
    });
  }
  // neither one node have available resources for rescheduling pods all pods
  if (nodeOfPodsThatCanBeRescheduledToTheCandidateNode.length === 0) {
    logger.warn(
      `[namespace - ${namespace}] No candidate nodes have available resources for rescheduling all pods to new nodes`
    );
  }

  // // if there are some nodes that have available resources for rescheduling pods
  if (
    nodeOfPodsThatCanBeRescheduledToTheCandidateNode.length !==
    uniqueCurrentNodes.length
  ) {
    const logCurrNodes = nodeOfPodsThatCanBeRescheduledToTheCandidateNode
      .map((n) => n.currentNode)
      .join(', ');

    const logCandNodes = nodeOfPodsThatCanBeRescheduledToTheCandidateNode
      .map((n) => n.candidateNode)
      .join(', ');

    console.log(nodeOfPodsThatCanBeRescheduledToTheCandidateNode);
    logger.info(
      `[namespace - ${namespace}] All pods from node/s [${logCurrNodes}] can be rescheduled to node/s [${logCandNodes}] respectively`
    );

    // if these pods of these nodes rescheduled then will free their resources
    // end the turn here
    // in the next turn the remain pods from other nodes will be rescheduled
  }

  /*
  console.log('*****************MARKED RESCHEDULED*******************');
  console.log(replacementPods);
  // TODO CHECK IF CANDIDATE NODE HAS AVAILABLE RESOURCES. OTHER MAKE AN EXCHANGE
  // for each candidate rescheduled pod find if the candidate rescheduling node have sufficient resources
  for (const markPod of replacementPods) {
    // get node resources
    const cNode = nodesResources.find((n) => n.name === markPod!.candidateNode);

    if (!cNode) continue;

    const cCpuAvailable = cNode.allocatable.cpu - cNode.requested.cpu;
    const cRamAvailable = cNode.allocatable.memory - cNode.requested.memory;

    // check if cNode has available resources
    const cAvailable =
      cCpuAvailable - markPod.maxPodCpu > 50 &&
      cRamAvailable - markPod.maxPodRam > 50;

    // the candidate node does not have enough resources for exchange
    // if (
    //   cCpuAvailable - markPod.maxPodCpu < 50 ||
    //   cRamAvailable - markPod.maxPodRam < 50
    // ) {
    //   continue;
    // }

    // node does not have sufficient resources.
    // Have to remove from this node pods with the least available resources and least response time
    if (!cAvailable) {
      // check if other rescheduled pods will be moved from the current pod to the rescheduled node
      // filter all replacement pods and find rescheduling pods that will be moved from the candidate Node of a pod
      const otherReplacementPods = replacementPods.filter(
        (rp) => rp.currentNode === markPod.candidateNode
      );

      if (otherReplacementPods.length !== 0) {
        // then check if these pods has resources higher or equal than the rescheduled pod
        // if find candidates then continue;
        //
        // if not then continue and find pods that can be rescheduled from the candidate node
      }
      console.log('*****************FIND NEW CANDIDATES*******************');
      console.log(otherReplacementPods);
      console.log('*****************POD RESOURCES*******************');
      console.log(podsResources);
      // find pods that have least response time and resources like the rescheduled pod
      // find nodes that have enough space then try to find a node with enough space for evicted pods
      // if any node have enough space then this rescheduled pod can not move to a new node. Continue
      // find which pod are in this node
    }

    // IN THE BEGINNING CHECK REPLICA PODS OF DOWNSTREAM DEPLOYMENT. TODO AT LEAST ONE REPLICA POD MUST BE IN DIFFERENT NODE/ZONE THAN
    // THE OTHER REPLICA PODS FOR FAULT TOLERANCE
  }*/

  // TODO if response time of some replica pods is higher than 500 and these pods does not marked as rescheduled, then try to create a new replica pod for them
  // in the same node as their most replica sources.

  return replacementPods as DeploymentPlacementModel[];
};

// Function to sum CPU and RAM usage for each node
const sumCpuAndMemoryByNode = (
  pods: CandidateReschedulingPods[]
): ObjectResources => {
  const usageByNode: ObjectResources = {};

  pods.forEach((pod) => {
    const candidateNode = pod.candidateNode;

    if (!usageByNode[candidateNode]) {
      usageByNode[candidateNode] = [
        { totalCpu: 0, totalMemory: 0, currentNode: pod.currentNode },
      ];
    }

    const findIndexOfCurrentNode = usageByNode[candidateNode].findIndex(
      (n) => n.currentNode === pod.currentNode
    );

    usageByNode[candidateNode][findIndexOfCurrentNode] = {
      totalCpu:
        usageByNode[candidateNode][findIndexOfCurrentNode].totalCpu +
        pod.maxPodCpu,
      totalMemory:
        usageByNode[candidateNode][findIndexOfCurrentNode].totalMemory +
        pod.maxPodMemory,
      currentNode: pod.currentNode,
    };
  });

  return usageByNode;
};

const getNodesAvailableResources = (
  nodes: string[],
  resources: NodeMetrics[]
): MapResourcesNode[] => {
  return nodes.map((node) => {
    const cNode = resources.find((n) => n.name === node);
    if (!cNode) return;
    return {
      name: cNode.name,
      cpu: cNode.allocatable.cpu - cNode.requested.cpu,
      memory: cNode.allocatable.memory - cNode.requested.memory,
    };
  }) as MapResourcesNode[];
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

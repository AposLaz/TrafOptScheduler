import { K8sClientTypeApi } from './enums';
import { k8sMapper } from './mapper';
import { SetupFolderFiles } from '../enums';
import { MetricsService } from './services/metrics.service';
import { NamespaceService } from './services/namespace.service';
import { NodeService } from './services/node.service';
import { ResourceService } from './services/resources.service';
import { Config } from '../config/config';
import { K8sClientApiFactory } from '../config/k8sClient';
import { DeploymentService } from './services/deploy.service';
import { PodService } from './services/pod.service';
import { readDataFromFile } from '../common/helpers';
import { logger } from '../config/logger';

import type {
  DeploymentPodMapType,
  NodeMetrics,
  PodMetrics,
  Resources,
} from './types';
import type { ConfigMetrics } from './types';
import type { LatencyProviderType } from './types';
import type * as k8s from '@kubernetes/client-node';

export class KubernetesManager {
  private metrics: MetricsService;
  private namespaceAdapter: NamespaceService;
  private resource: ResourceService;
  private deployment: DeploymentService;
  private pod: PodService;
  private node: NodeService;

  constructor() {
    const metricClient = K8sClientApiFactory.getClient(
      K8sClientTypeApi.METRICS
    ) as k8s.Metrics;

    const coreClient = K8sClientApiFactory.getClient(
      K8sClientTypeApi.CORE
    ) as k8s.CoreV1Api;

    const objectClient = K8sClientApiFactory.getClient(
      K8sClientTypeApi.OBJECTS
    ) as k8s.KubernetesObjectApi;

    const appsClient = K8sClientApiFactory.getClient(
      K8sClientTypeApi.APPS
    ) as k8s.AppsV1Api;

    const metrics: ConfigMetrics = Config.metrics;

    this.metrics = new MetricsService(metricClient, coreClient, metrics);
    this.namespaceAdapter = new NamespaceService(coreClient);
    this.resource = new ResourceService(objectClient);
    this.deployment = new DeploymentService(appsClient);
    this.pod = new PodService(coreClient);
    this.node = new NodeService(coreClient);
  }

  /**
   * Apply a list of resources to the kubernetes cluster.
   *
   * @param resources - a list of kubernetes resources to apply.
   * These resources will be applied to the cluster. If the resource
   * already exists, it will be patched. If the resource does not
   * exist, it will be created.
   *
   * @returns a list of resources that were created or patched.
   * If a resource already existed and was not patched, it will not
   * be included in the return list.
   */
  async applyResources(resources: k8s.KubernetesObject[]) {
    return this.resource.apply(resources);
  }

  /**
   * Applies resources defined in a YAML file to the Kubernetes cluster.
   *
   * @param specPath - The file path to the YAML specification file or directory containing multiple YAML files.
   *                   The path should point to a file or directory containing Kubernetes resource definitions.
   *                   These resources will be applied to the cluster. If a resource already exists, it will be
   *                   patched; otherwise, it will be created.
   *
   * @returns A promise that resolves when the operation is complete. The promise will resolve to a list of
   *          resources that were either created or patched. If a resource already existed and was not patched,
   *          it will not be included in the return list.
   */
  async applyResourcesFromFile(specPath: string) {
    return this.resource.applyFromFile(specPath);
  }

  async getClassifiedPodsByThreshold(ns: string) {
    return this.metrics.classifyPodsByThreshold(ns);
  }

  /**
   * Create a Kubernetes namespace if it does not already exist.
   *
   * @param ns - The name of the namespace to create.
   *
   */
  async createNamespace(ns: string, labels?: { [key: string]: string }) {
    return this.namespaceAdapter.createNamespaceIfNotExists(ns, labels);
  }

  /**
   * This function creates a new replica pod of a deployment on a specific set of nodes.
   * It does this by:
   * 1. Tainting the nodes so that the deployment will not schedule a pod on it.
   * 2. Increasing the number of replicas of the deployment.
   * 3. Removing the taint so that the deployment can schedule a pod on it.
   *
   * This is used to manually control the scheduling of pods to specific nodes.
   * @param deploymentName - The name of the deployment to create a replica pod for.
   * @param ns - The namespace of the deployment.
   * @param nodes - The nodes to schedule the pod on.
   */
  async createReplicaPodToSpecificNode(
    deploymentName: string,
    ns: string,
    nodes: string[]
  ) {
    // Taint the nodes so that the deployment will not schedule a pod on it.
    const taint = k8sMapper.toNodeTaints(deploymentName);
    await this.node.addTaint(nodes, taint);

    // Increase the number of replicas of the deployment.
    await this.deployment.handleDeployReplicas(deploymentName, ns, 'add');

    // Remove the taint from the nodes so that the deployment can schedule a pod on it.
    const taintKey = taint.key;
    await this.node.removeTaint(nodes, taintKey);
  }

  async getPodsOfEachDeploymentByNs(
    ns: string
  ): Promise<Record<string, DeploymentPodMapType[]> | undefined> {
    const [deployments, replicaSets, pods] = await Promise.all([
      this.deployment.fetchDeploymentsByNamespace(ns),
      this.deployment.fetchDeploymentReplicaSetsByNamespace(ns),
      this.pod.fetchPodsByNamespace(ns),
    ]);

    if (!deployments || !replicaSets || !pods) {
      return;
    }

    const podsByDeployment: Record<string, DeploymentPodMapType[]> = {};
    for (const deployment of deployments) {
      const deploymentName = deployment.metadata?.name || 'unknown';

      // add new deployment
      if (!podsByDeployment[deploymentName]) {
        podsByDeployment[deploymentName] = [];
      }

      // Get ReplicaSets owned by this Deployment
      const rs = replicaSets.filter((rs) =>
        rs.metadata?.ownerReferences?.some(
          (owner) =>
            owner.kind === 'Deployment' && owner.name === deploymentName
        )
      );

      // Add ReplicaSet names to the Deployment map
      for (const r of rs) {
        const replicaSetName = r.metadata?.name || 'unknown';

        // Get Pods owned by this ReplicaSet
        const podRs = pods.filter((pod) =>
          pod.metadata?.ownerReferences?.some(
            (owner) =>
              owner.kind === 'ReplicaSet' && owner.name === replicaSetName
          )
        );

        // Add Pod names to the Deployment map
        podRs.forEach((pod) => {
          const podName = pod.metadata?.name || 'unknown';
          const node = pod.spec?.nodeName || 'unknown';
          podsByDeployment[deploymentName].push({
            pod: podName,
            node: node,
          });
        });

        // clear unknown pods
        podsByDeployment[deploymentName].filter(
          (p) => p.node !== 'unknown' && p.pod !== 'unknown'
        );
      }
    }

    return podsByDeployment;
  }

  /**
   * Gets the current metrics of all nodes in the Kubernetes cluster.
   *
   * @returns A promise that resolves to an array of objects, each of which contains the name of a node in the
   *          Kubernetes cluster, and the current CPU and memory usage of the node. If there is an error during the
   *          fetch, the promise will reject with the error.
   */
  async getNodesMetrics(): Promise<NodeMetrics[]> {
    return this.metrics.getNodesMetrics();
  }

  /**
   * Finds all nodes in the Kubernetes cluster that have sufficient resources to create a new replica pod for the given
   * deployment.
   *
   * @param pod - The resource requirements of the pod to be created. This is an object with two properties: `cpu` and
   *              `memory`, each of which is a number representing the amount of CPU or memory required by the pod.
   *
   * @returns A promise that resolves to an array of NodeMetrics objects. Each object contains information about a node in
   *          the Kubernetes cluster, including its name, and the amount of CPU and memory that is currently available on
   *          the node. Nodes that do not have sufficient resources to create a new replica pod are excluded from the
   *          returned array.
   */
  async getNodesWithSufficientResources(
    pod: Resources
  ): Promise<NodeMetrics[]> {
    // Get the current metrics for all nodes in the cluster
    const nodes = await this.metrics.getNodesMetrics();

    // Filter the list of nodes to only include those that have sufficient resources to create a new replica pod
    const sufficientResources = nodes.filter(
      (node) =>
        // Check that the node has enough CPU to create a new replica pod
        pod.cpu <= node.freeToUse.cpu &&
        // Check that the node has enough memory to create a new replica pod
        pod.memory <= node.freeToUse.memory
    );

    // Return the list of nodes with sufficient resources
    return sufficientResources;
  }

  /**
   * Gets the current metrics of all pods in the specified namespace.
   *
   * @param ns - The name of the namespace containing the pods for which to fetch metrics.
   *
   * @returns A promise that resolves to an array of PodMetrics objects. Each object contains
   *          detailed information about a pod's resource usage, such as CPU and memory metrics.
   *          If the function encounters any errors during the fetch process, the promise will be
   *          rejected with the corresponding error.
   */
  async getPodsMetricsByNamespace(ns: string): Promise<PodMetrics[]> {
    return this.metrics.getPodsMetrics(ns);
  }

  async getNodesRegionZoneAndLatency() {
    const file = `${SetupFolderFiles.DEFAULT_PATH}/${SetupFolderFiles.NETWORK_LATENCY_PATH}/${SetupFolderFiles.LATENCY_FILE}`;
    const latencyProvider = readDataFromFile(file);

    if (!latencyProvider) {
      logger.warning(`No latency provider found in ${file}`);
      return;
    }

    const latencyObject = latencyProvider as LatencyProviderType[];

    const nodes = await this.node.getNodes();

    const nodesTopology = k8sMapper.toClusterTopology(nodes);

    const nodesLatency = k8sMapper.toNodeLatency(nodesTopology, latencyObject);

    return nodesLatency;
  }
}

import * as k8s from '@kubernetes/client-node';
import { ResourceService } from './services/resources.service';
import { NamespaceService } from './services/namespace.service';
import { MetricsService } from './services/metrics.service';
import { NodeMetrics, PodMetrics } from './types';
import { K8sClientTypeApi } from './enums';
import { K8sClientApiFactory } from '../config/k8sClient';
import { Config } from '../config/config';
import { ConfigMetrics } from './types';

export class KubernetesManager {
  private metrics: MetricsService;
  private namespaceAdapter: NamespaceService;
  private resource: ResourceService;

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

    const metrics: ConfigMetrics = Config.metrics;

    this.metrics = new MetricsService(metricClient, coreClient, metrics);
    this.namespaceAdapter = new NamespaceService(coreClient);
    this.resource = new ResourceService(objectClient);
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
}

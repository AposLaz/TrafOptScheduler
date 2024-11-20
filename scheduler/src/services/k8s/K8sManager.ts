import * as k8s from '@kubernetes/client-node';
import { ResourceAdapter } from './adapters/k8s.resources.service';
import { NamespaceAdapter } from './adapters/k8s.namespace.service';

export class K8sManager {
  private namespaceAdapter: NamespaceAdapter;
  private resourceAdapter: ResourceAdapter;

  constructor() {
    this.namespaceAdapter = new NamespaceAdapter();
    this.resourceAdapter = new ResourceAdapter();
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
    return this.resourceAdapter.apply(resources);
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
    return this.resourceAdapter.applyFromFile(specPath);
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
}

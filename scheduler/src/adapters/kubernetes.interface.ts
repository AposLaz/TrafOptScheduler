import type { DeploymentReplicaPodsMetrics } from '../types';
import type { ClusterAzTopology, NodeMetrics, Resources } from './k8s/types';
import type * as k8s from '@kubernetes/client-node';

export interface KubernetesAdapter {
  applyResources(
    resources: k8s.KubernetesObject[]
  ): Promise<k8s.KubernetesObject[]>;
  applyResourcesFromFile(specPath: string): Promise<k8s.KubernetesObject[]>;
  createNamespace(
    ns: string,
    labels?: { [key: string]: string }
  ): Promise<void>;
  getDeploymentsMetrics(
    namespace: string
  ): Promise<DeploymentReplicaPodsMetrics | undefined>;
  getClusterAzTopology(): Promise<ClusterAzTopology>;
  getNodesMetrics(): Promise<NodeMetrics[]>;
  getNodesWithSufficientResources(pod: Resources): Promise<NodeMetrics[]>;
  createReplicaPodToSpecificNode(
    deploymentName: string,
    ns: string,
    nodes: string[]
  ): Promise<void>;
  removeReplicaPodToSpecificNode(
    deploymentName: string,
    pod: string,
    ns: string
  ): Promise<void>;
}

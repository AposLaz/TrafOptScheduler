import type { DeploymentReplicaPodsMetrics } from '../types';
import type { ClusterTopology, NodeMetrics, Resources } from './k8s/types';
import type * as k8s from '@kubernetes/client-node';

export interface KubernetesAdapter {
  addLocalityLabels(): Promise<void>;
  applyResources(resources: k8s.KubernetesObject[]): Promise<k8s.KubernetesObject[]>;
  applyResourcesFromFile(specPath: string): Promise<k8s.KubernetesObject[]>;
  createNamespace(ns: string, labels?: { [key: string]: string }): Promise<void>;
  getDeploymentsMetrics(namespace: string): Promise<DeploymentReplicaPodsMetrics | undefined>;
  getClusterTopology(): Promise<ClusterTopology[]>;
  getNodesMetrics(): Promise<NodeMetrics[]>;
  getNodesWithSufficientResources(pod: Resources): Promise<NodeMetrics[]>;
  createReplicaPodToSpecificNode(deploymentName: string, ns: string, nodes: string[]): Promise<void>;
  removeReplicaPodToSpecificNode(deploymentName: string, pod: string, ns: string): Promise<void>;
}

import type { NodeUsage, PodMetrics } from '../k8s/types';

export class OptiScaler {
  private replicas: PodMetrics[];
  private criticalNode: NodeUsage[];

  constructor(replicaPods: PodMetrics[], criticalNode: NodeUsage[]) {
    this.replicas = replicaPods;
    this.criticalNode = criticalNode;
  }
}

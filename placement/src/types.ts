export interface NodesMetrics {
  metric: {
    node: string;
  };
  value: [number, string];
}

export interface NodesCPU {
  requested_cpu?: number; //cpu that need all pods in every node
  node_available_cpu?: number; //available cpu for use in every node
  max_cpu?: number; //max cpu that can be used for pods in every node
}

export interface NodesMEM {
  requested_memory?: number; //memory that need all pods in every node
  node_available_memory?: number; //available memory for use in every node
  max_memory?: number; // max memory that can be used for pods in every node
}

export interface NodeMemCpu {
  node_name: string;
  cpu?: NodesCPU;
  memory?: NodesMEM;
}

export interface ClusterTypes {
  cluster_ip: string;
  nodes: Array<NodeMemCpu>;
}

/*-----------------------------*/

export interface DeployResources {
  requested: number;
  limit: number;
  in_use: number;
}

export interface DeployMetrics {
  cpu: DeployResources;
  ram: DeployResources;
}

export interface Deploys {
  name: string;
  namespace: string;
  metrics: DeployMetrics;
}

export interface ClusterInfo {
  node: string;
  deploys: Deploys[];
}

export interface KubernetesData {
  context: string;
  info: ClusterInfo[];
  prometheusIP: string;
}

export type SetupGkeConfigs = {
  istioHost: string;
  kialiHost: string;
  prometheusHost: string;
};

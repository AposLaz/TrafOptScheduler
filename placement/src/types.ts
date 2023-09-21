export interface NodesMetrics {
  metric: {
    node: string;
  };
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

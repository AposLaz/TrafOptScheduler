export type DeploymentLabels = {
  deployment: string;
  matchLabels: { [key: string]: string };
};

export type DeploymentReplicasData = DeploymentLabels & {
  nodes: {
    name: string;
    pods: string[];
  }[];
  replicasNum: number;
};

export type ReplicasAction = 'add' | 'delete';

export type DeploymentPlacementModel = {
  deploymentName: string;
  nodes: string[];
  namespace: string;
  deletePod: string;
};

export type DeploymentNotReadyFilesystem = Omit<
  DeploymentPlacementModel,
  'nodes'
>;

/**
 * CPU to millicores
 * Memory to MB
 */
export type Resources = {
  cpu: number;
  memory: number;
};

export type PodType = {
  namespace: string;
  node: string;
  podName: string;
  usage: Resources;
  requested: Resources;
  limits: Resources;
};

export type NodeType = {
  name: string;
  capacity: Resources;
  allocatable: Resources;
  requested: Resources;
  limits: Resources;
};

/**************************************************************************************************/
/*************************                    KIALI TYPES                  ************************/
/**************************************************************************************************/

export type FormattedEdge = {
  source: string;
  target: string;
  responseTime?: string;
  protocol: string;
  rps?: string;
};

type TrafficRates = {
  tcp?: string;
  grpc?: string;
  http?: string;
  https?: string;
};

type Traffic = {
  protocol: string;
  rates: TrafficRates;
};

type ServiceData = {
  id: string;
  cluster: string;
  nodeType: string;
  namespace: string;
  service: string;
  workload: string;
  app?: string;
  version?: string;
  destServices: { namespace: string; name: string }[];
  traffic: Traffic[];
  isRoot?: boolean;
};

type Node = {
  data: ServiceData;
};

type EdgeData = {
  id: string;
  source: string; // ID of the source pod
  target: string; // ID of the target pod
  responseTime?: string;
  traffic: Traffic;
};

type Edge = {
  data: EdgeData;
};

export type GraphData = {
  timestamp: number;
  duration: number;
  graphType: string;
  elements: {
    nodes: Node[];
    edges: Edge[]; // Add edges here
  };
};

export type GraphEdges = {
  source: string | undefined;
  target: string | undefined;
  namespace: string;
};

/**************************************************************************************************/
/*************************               PROMETHEUS TYPES                  ************************/
/**************************************************************************************************/

export type PrometheusFetchData_Istio_Metrics = {
  status: string;
  data: {
    resultType: string;
    result: {
      metric: {
        node: string;
        source_workload: string;
        destination_workload: string;
        pod: string;
      };
      value: [number, string];
    }[];
  };
};

export type PrometheusTransformResultsToIstioMetrics = {
  node: string;
  source: string;
  target: string;
  replicaPod: string;
  metric: number;
};

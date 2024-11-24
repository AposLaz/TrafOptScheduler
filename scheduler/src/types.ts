/** DEFAULT TYPES */

export type ObjectStrings = { [key: string]: string[] };
export type ObjectResources = Record<
  string,
  { totalCpu: number; totalMemory: number; currentNode: string }[]
>;
export type MapResourcesNode = {
  name: string;
  cpu: number;
  memory: number;
};

/************************** THRESHOLD EVALUATION */

export type ThresholdEvaluationResult = {
  aboveThreshold: PodMetrics[];
  belowThreshold: PodMetrics[];
};

/************************* EXCHANGE PODS */

export type CandidateAndCurrentNodes = {
  currentNode: string;
  candidateNode: string;
};

/************************ RESPONSE TIME TYPES */

export type DeploymentLabels = {
  deployment: string;
  matchLabels: { [key: string]: string };
};

type NodePodsMap = {
  name: string;
  pods: string[];
};

export type DeploymentReplicasData = DeploymentLabels & {
  nodes: NodePodsMap[];
};

export type CandidateReschedulingPods = DeploymentPlacementModel & {
  candidateNode: string; // this is the node where the pod will be created
  currentNode: string;
  maxPodCpu: number;
  maxPodMemory: number;
};

/*********************************** TAINT TYPES */

export type ReplicasAction = 'add' | 'delete';

export type DeploymentPlacementModel = {
  deploymentName: string;
  nodes: string[]; // taint these nodes
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

export type PodMetrics = {
  namespace: string;
  node: string;
  podName: string;
  usage: Resources;
  requested: Resources;
  limits: Resources;
};

export type NodeMetrics = {
  name: string;
  capacity: Resources;
  allocatable: Resources;
  requested: Resources;
  limits: Resources;
};

/*********************************** PROMETHEUS TYPES */

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

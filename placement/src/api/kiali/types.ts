type TrafficRates = {
  [key: string]: string;
};

type Traffic = {
  protocol: string;
  rates: TrafficRates;
};

type ServiceData = {
  id: string;
  nodeType: string;
  namespace: string;
  service?: string;
  workload?: string;
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

export type Metadata = {
  annotations?: { [key: string]: string };
  labels?: { [key: string]: string };
  name: string;
  namespace: string;
};

export type RamCpuData = {
  memory: string;
  cpu: string;
};

export type RequestLimit = {
  requests: RamCpuData;
  limits: RamCpuData;
};

export type Resources = {
  resources: RequestLimit;
};

export type PodSpec = {
  containers: Resources[];
};

export type PodType = {
  metadata?: Metadata;
  spec: PodSpec;
};

export type DeploySpec = {
  replicas?: number;
  revisionHistoryLimit?: number;
  template: PodType;
};

export type DeployStatus = {
  availableReplicas?: number;
  readyReplicas?: number;
  replicas?: number;
};

export type DeploymentType = {
  apiVersion?: string;
  /**
   * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
   */
  kind?: string;
  metadata: Metadata;
  spec: DeploySpec;
  status?: DeployStatus;
};

export type DeployList = {
  apiVersion?: string;
  items: DeploymentType[];
  kind?: string;
  metadata?: { resourceVersion?: string };
};

export type podLocation = {
  node: string;
  zone: string;
  region: string;
};

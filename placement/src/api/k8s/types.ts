export interface Metadata {
  annotations?: { [key: string]: string };
  labels?: { [key: string]: string };
  name: string;
  namespace: string;
}

export interface RamCpuData {
  memory: string;
  cpu: string;
}

export interface RequestLimit {
  requests: RamCpuData;
  limits: RamCpuData;
}

export interface Resources {
  resources: RequestLimit;
}

export interface PodSpec {
  containers: Resources[];
}

export interface PodType {
  metadata?: Metadata;
  spec: PodSpec;
}

export interface DeploySpec {
  replicas?: number;
  revisionHistoryLimit?: number;
  template: PodType;
}

export interface DeployStatus {
  availableReplicas?: number;
  readyReplicas?: number;
  replicas?: number;
}

export interface DeploymentType {
  apiVersion?: string;
  /**
   * Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
   */
  kind?: string;
  metadata: Metadata;
  spec: DeploySpec;
  status?: DeployStatus;
}

export interface DeployList {
  apiVersion?: string;
  items: DeploymentType[];
  kind?: string;
  metadata?: { resourceVersion?: string };
}

enum NamespacesExclude {
  KUBE_NODE_LEASE = 'kube-node-lease',
  KUBE_PUBLIC = 'kube-public',
  KUBE_SYSTEM = 'kube-system',
  ISTIO_SYSTEM = 'istio-system',
}

export const namespacesExclude = Object.values(NamespacesExclude) as string[];

export enum TaintEffects {
  NO_SCHEDULE = 'NoSchedule',
  NO_EXECUTE = 'NoExecute',
  PREFER_NO_SCHEDULE = 'PreferNoSchedule',
}

export enum Operators {
  EQUAL = 'Equal',
  EXISTS = 'Exists',
}

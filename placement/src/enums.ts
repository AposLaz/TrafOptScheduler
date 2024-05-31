enum NamespacesExclude {
  KUBE_NODE_LEASE = "kube-node-lease",
  KUBE_PUBLIC = "kube-public",
  KUBE_SYSTEM = "kube-system",
  ISTIO_SYSTEM = "istio-system",
}

export const namespacesExclude = Object.values(NamespacesExclude) as string[];

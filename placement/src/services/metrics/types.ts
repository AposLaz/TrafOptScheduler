/**
 * Cluster Common Resources
 */

export type ClusterCommonResources = {
  node: string;
  metrics: {
    allocation: number;
    requested: number;
    available: number;
  };
};

export type ClusterResourcesMemCpu = {
  node: string;
  cpu: {
    allocation: number;
    requested: number;
    available: number;
  };
  memory: {
    allocation: number;
    requested: number;
    available: number;
  };
};
/**
 * Cluster resources
 */
export type ClusterResourcesByNamespace = {
  namespace: string;
  nodes: {
    name: string;
    metrics: {
      memory: {
        available: number;
        allocation: number; // this is the memory that can be used by pods
        requested: number;
      };
      cpu: {
        available: number;
        allocation: number; // this is the cpu that can be used by pods
        requested: number;
      };
    };
    pods: {
      name: string;
      metrics: {
        memory: {
          requested: number;
          limit: number;
          usage: number;
        };
        cpu: {
          requested: number;
          limit: number;
          usage: number;
        };
      }[];
    }[];
  }[];
};

/**
 * Exchanged Bytes and Total Size Metrics
 */
export type AppLinksBytes = {
  source: string;
  target: string;
  replicas: {
    pod: string;
    node: string;
    sumBytes: number;
    countBytes: number;
  };
};

export type AppLinksReplicasBytes = {
  source: string;
  target: string;
  replicas: {
    pod: string;
    node: string;
    sumBytes: number;
    countBytes: number;
  }[];
  linkBytesExchanged: number;
  linkMessagesSize: number;
};

export type TrafficRatesBytes = {
  namespace: string;
  appLinks: AppLinksReplicasBytes[];
  totalBytesExchanged: number;
  totalMessagesSize: number;
};

/**
 * App Response Times
 */

export type FormattedEdge = {
  source: string;
  target: string;
  responseTime?: string;
  protocol: string;
  rps?: string;
};

/**
 * Total Messages exchanged
 */

export type AppLinksMessages = {
  source: string;
  target: string;
  replicas: {
    pod: string;
    node: string;
    totalMessages: number;
  };
};

export type AppLinksReplicasMessages = {
  source: string;
  target: string;
  replicas: {
    pod: string;
    node: string;
    totalMessages: number;
  }[];
  linkTotalMessagesExchanged: number;
};

export type TrafficRatesMessages = {
  namespace: string;
  appLinks: AppLinksReplicasMessages[];
  totalMessagesExchanged: number;
};

/**
 * Total Latency between links
 */

export type AppLinksLatency = {
  source: string;
  target: string;
  replicas: {
    pod: string;
    node: string;
    latency: number;
  };
};

export type AppLinksReplicasLatency = {
  source: string;
  target: string;
  replicas: {
    pod: string;
    node: string;
    latency: number;
  }[];
  linkTotalLatency: number;
};

export type TrafficRatesLatency = {
  namespace: string;
  appLinks: AppLinksReplicasLatency[];
  totalLatency: number;
};

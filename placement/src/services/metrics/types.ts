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
        usage: number;
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
export type AppLinks = {
  source: string;
  target: string;
  replicas: {
    pod: string;
    node: string;
    sumBytes: number;
    countBytes: number;
  };
};

export type AppLinksReplicas = {
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
  appLinks: AppLinksReplicas[];
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

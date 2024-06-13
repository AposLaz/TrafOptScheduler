export type AppLinksReplicasAffinities = {
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
  affinity: number;
};

export type TrafficExcSizeBytesAffinities = {
  namespace: string;
  appLinks: AppLinksReplicasAffinities[];
  totalExchBytes: number;
  totalMsgSize: number;
};

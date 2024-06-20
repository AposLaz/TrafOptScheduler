type Replica = {
  pod: string;
  node: string;
  sumBytes: number;
  countBytes: number;
};

type TargetPodsProps = {
  target: string;
  replicas: Replica[];
  linkBytesExchanged: number;
  linkMessagesSize: number;
  affinity: number;
};

export type AppLinksReplicasAffinities = TargetPodsProps & {
  source: string;
};

export type TrafficExcSizeBytesAffinities = {
  namespace: string;
  appLinks: AppLinksReplicasAffinities[];
  totalExchBytes: number;
  totalMsgSize: number;
};

// Every sourceTargets is a community in modSoft algorithm
export type SourceTargetsAppLinks = {
  source: string;
  targets: TargetPodsProps[];
  degreeSourceTargetsAffinity: number; // is the sum of affinities for all targets linked from a given source.
  communitiesProb: [{ [key: string]: number }];
};

export type AppLinksGraphAffinities = {
  namespace: string;
  appLinks: SourceTargetsAppLinks[];
  totalExchBytes: number;
  totalMsgSize: number;
  totalWeightAffinity: number; // is the sum of affinities of all target links for each source.
};

type AvgProbabilityGraphAffinities = SourceTargetsAppLinks & {
  avgProbability: number;
};

export type AppLinksGraphAvgPropAndAffinities = Omit<
  AppLinksGraphAffinities,
  'appLinks'
> & {
  appLinks: AvgProbabilityGraphAffinities[];
};

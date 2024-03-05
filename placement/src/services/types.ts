type UMpods = {
  name: string;
  allocation: number;
};

type DMpods = {
  name: string;
  allocation: number;
  trafficAccepts: {
    traffic: number;
    nodeName: string;
  }[];
};

export type ClusterType = {
  node: string;
  umSvc: string;
  dmSvc: string;
  umPods: UMpods[];
  dmPods: DMpods[];
};

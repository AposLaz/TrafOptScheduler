type UMpods = {
  name: string;
  allocation: number;
};

export type DMpods = {
  name: string;
  allocation: number;
  trafficAccepts: {
    traffic: number;
    zoneName: string;
  }[];
};

export type ClusterType = {
  zone: string;
  umSvc: string;
  dmSvc: string;
  umPods: UMpods[];
  dmPods: DMpods[];
};

export type TrafficSummaryPerZone = {
  zone: string;
  traffic: number;
};

export type DestinationRuleFromToZones = {
  from: string;
  to: {
    [key: string]: number;
  };
};

export type DestinationRuleProps = {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
  };
  spec: {
    host: string;
    trafficPolicy: {
      loadBalancer: {
        localityLbSetting: {
          enabled: boolean;
          distribute: DestinationRuleFromToZones[];
        };
      };
      outlierDetection: {
        consecutive5xxErrors: number;
        interval: string;
        baseEjectionTime: string;
      };
    };
  };
};

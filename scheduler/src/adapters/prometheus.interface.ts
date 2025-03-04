import type { NodesLatency, GraphDataRps } from './prometheus/types';

export interface PrometheusAdapter {
  getDownstreamPodGraph(deployment: string, namespace: string): Promise<GraphDataRps[] | undefined>;
  getUpstreamPodGraph(deployment: string, namespace: string): Promise<GraphDataRps[] | undefined>;
  getNodesLatency(): Promise<NodesLatency[] | undefined>;
}

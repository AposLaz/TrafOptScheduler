import type { NodesLatency, GraphDataRps } from './prometheus/types.js';

export interface PrometheusAdapter {
  getDownstreamPodGraph(deployment: string, namespace: string): Promise<GraphDataRps[] | undefined>;
  getUpstreamPodGraph(deployment: string, namespace: string): Promise<GraphDataRps[] | undefined>;
  getNodesLatency(): Promise<NodesLatency[] | undefined>;
  getAvgPodCpuUsage(pod: string, namespace: string, time: string): Promise<number | undefined>;
  getAvgPodMemoryUsage(pod: string, namespace: string, time: string): Promise<number | undefined>;
  getCurrentPodCpuUsage(pod: string, namespace: string): Promise<number | undefined>;
  getCurrentPodMemoryUsage(pod: string, namespace: string): Promise<number | undefined>;
}

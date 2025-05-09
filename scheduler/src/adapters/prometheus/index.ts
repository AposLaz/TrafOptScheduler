import { PrometheusMapper } from './mapper.js';
import { Graph } from './services/app.graph.js';
import { ResourcesMetricsService } from './services/resources.metrics.service.js';
import { Config } from '../../config/config.js';

import type { GraphDataRps, NodesLatency } from './types.js';
import type { PrometheusAdapter } from '../prometheus.interface.js';

export class PrometheusAdapterImpl implements PrometheusAdapter {
  private readonly time = Config.CRONJOB_TIME;
  private readonly prometheusUrl = Config.prometheusUrl;
  private readonly appGraph: Graph;
  private readonly resourcesMetrics: ResourcesMetricsService;

  constructor() {
    this.appGraph = new Graph(this.prometheusUrl);
    this.resourcesMetrics = new ResourcesMetricsService(this.prometheusUrl);
  }

  async getDownstreamPodGraph(deployment: string, namespace: string): Promise<GraphDataRps[] | undefined> {
    return this.appGraph.getDeploymentDownstream(deployment, namespace, this.time);
  }

  async getUpstreamPodGraph(deployment: string, namespace: string): Promise<GraphDataRps[] | undefined> {
    return this.appGraph.getDeploymentUpstream(deployment, namespace, this.time);
  }

  async getNodesLatency(): Promise<NodesLatency[] | undefined> {
    const data = await this.resourcesMetrics.fetchNodesLatency(this.time);

    if (!data) {
      return;
    }

    return PrometheusMapper.toNodesLatency(data);
  }
}

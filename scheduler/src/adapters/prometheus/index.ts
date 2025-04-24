import { PrometheusMapper } from './mapper';
import { Graph } from './services/app.graph';
import { ResourcesMetricsService } from './services/resources.metrics.service';
import { Config } from '../../config/config';

import type { GraphDataRps, NodesLatency } from './types';
import type { PrometheusAdapter } from '../prometheus.interface';

export class PrometheusAdapterImpl implements PrometheusAdapter {
  private readonly time = Config.CRONJOB_TIME;
  private readonly prometheusUrl = Config.prometheusUrl;
  private appGraph: Graph;
  private resourcesMetrics: ResourcesMetricsService;

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

import { PrometheusMapper } from './mapper';
import { Config } from '../config/config';
import { Graph } from './services/app.graph';
import { ResourcesMetricsService } from './services/resources.metrics.service';

export class PrometheusManager {
  private readonly time = Config.CRONJOB_TIME;
  private readonly prometheusUrl = Config.prometheusUrl;
  private appGraph = new Graph(this.prometheusUrl);
  private resourcesMetrics = new ResourcesMetricsService(this.prometheusUrl);

  async getDownstreamPodGraph(deployment: string, namespace: string) {
    return await this.appGraph.getDeploymentDownstream(
      deployment,
      namespace,
      this.time
    );
  }

  async getUpstreamPodGraph(deployment: string, namespace: string) {
    return await this.appGraph.getDeploymentUpstream(
      deployment,
      namespace,
      this.time
    );
  }

  async getNodesLatency() {
    const data = await this.resourcesMetrics.fetchNodesLatency(this.time);

    if (!data) {
      return;
    }

    return PrometheusMapper.toNodesLatency(data);
  }
}

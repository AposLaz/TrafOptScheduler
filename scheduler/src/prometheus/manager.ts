import { PrometheusMapper } from './mapper';
import { Config } from '../config/config';
import { MetricsType } from '../k8s/enums';
import { ResourcesMetricsService } from './services/resources.metrics.service';
import { Graph } from './services/app.graph';

export class PrometheusManager {
  private readonly time = Config.CRONJOB_TIME;
  private readonly prometheusUrl = Config.prometheusUrl;
  private appGraph = new Graph(this.prometheusUrl);

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
}

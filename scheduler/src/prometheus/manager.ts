import { PrometheusMapper } from './mapper';
import { Config } from '../config/config';
import { MetricsType } from '../k8s/enums';
import { ResourcesMetricsService } from './services/resources.metrics.service';

export class PrometheusManager {
  private readonly time = Config.CRONJOB_TIME;
  private readonly prometheusUrl = Config.prometheusUrl;

  private metrics = new ResourcesMetricsService(this.prometheusUrl);

  private async getPodCpuUsageRelativeToLimit(namespace: string, time: string) {
    const pods = await this.metrics.fetchPodCpuUsageRelativeToLimit(
      namespace,
      time
    );

    if (!pods) return;
    return PrometheusMapper.toUpperLowerLimitPods(pods);
  }

  private async getPodMemoryUsageRelativeToLimit(namespace: string) {
    const pods =
      await this.metrics.fetchPodMemoryUsageRelativeToLimit(namespace);

    if (!pods) return;
    return PrometheusMapper.toUpperLowerLimitPods(pods);
  }

  private async getPodCpuMemoryUsageRelativeToLimit(
    namespace: string,
    time: string
  ) {
    const pods = await this.metrics.fetchPodCpuMemoryUsageRelativeToLimit(
      namespace,
      time
    );

    if (!pods) return;
    return PrometheusMapper.toUpperLowerLimitPods(pods);
  }

  getPodThresholds(metric: MetricsType, namespace: string) {
    switch (metric) {
      case MetricsType.CPU:
        return this.getPodCpuUsageRelativeToLimit(namespace, this.time);
      case MetricsType.MEMORY:
        return this.getPodMemoryUsageRelativeToLimit(namespace);
      case MetricsType.CPU_MEMORY:
        return this.getPodCpuMemoryUsageRelativeToLimit(namespace, this.time);
      default:
        throw new Error(
          `Invalid metric provided. Expected one of ${Object.values(MetricsType).join(', ')}`
        );
    }
  }
}

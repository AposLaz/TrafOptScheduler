import { PrometheusMapper } from './mapper';
import { Config } from '../config/config';
import { MetricsType } from '../k8s/enums';
import { ResourcesMetricsService } from './services/resources.metrics.service';

export class PrometheusManager {
  private readonly time = Config.CRONJOB_TIME;
  private readonly prometheusUrl = Config.prometheusUrl;
}

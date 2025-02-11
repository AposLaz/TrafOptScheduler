import * as dotenv from 'dotenv';

import { MetricsType } from '../k8s/enums';
dotenv.config();

// required environment variables
const requiredEnvVariables: Array<string> = [];

requiredEnvVariables.forEach((envVarName: string) => {
  if (!process.env[envVarName]) {
    console.log(`Environment variable ${envVarName} is missing`);
  }
});

export const Config = {
  ENV: process.env.ENV ?? 'production',
  APP_PORT: process.env.APP_PORT ?? '3000',
  NAMESPACES: process.env.NAMESPACES?.split(',') ?? ['default'], // default is the default namespace
  CRONJOB_TIME: process.env.CRONJOB_TIME ?? '1m',
  RESPONSE_TIME_THRESHOLD: Number(process.env.RESPONSE_TIME_THRESHOLD) ?? 100,
  metrics: {
    upperThreshold: process.env.METRICS_UPPER_THRESHOLD
      ? Number(process.env.METRICS_UPPER_THRESHOLD) / 100
      : 0.8,
    lowerThreshold: process.env.METRICS_LOWER_THRESHOLD
      ? Number(process.env.METRICS_LOWER_THRESHOLD) / 100
      : 0.2,
    type: (process.env.METRICS_TYPE as MetricsType) ?? MetricsType.MEMORY,
    weights: {
      CPU: process.env.CPU_WEIGHT ? Number(process.env.CPU_WEIGHT) : 0.5,
      Memory: process.env.MEMORY_WEIGHT
        ? Number(process.env.MEMORY_WEIGHT)
        : 0.5,
    },
  },
  prometheusUrl:
    process.env.PROMETHEUS_URL ??
    'http://prometheus.prometheus.svc.cluster.local:9090',
  istio: {
    kiali: {
      url:
        process.env.KIALI_URL ??
        'http://kiali.istio-system.svc.cluster.local:20001',
      username: process.env.KIALI_USERNAME ?? 'admin',
      password: process.env.KIALI_PASSWORD ?? 'admin',
    },
  },
};

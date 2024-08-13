import * as dotenv from 'dotenv';
dotenv.config();

// required environment variables
const requiredEnvVariables: Array<string> = [];

requiredEnvVariables.forEach((envVarName: string) => {
  if (!process.env[envVarName]) {
    console.log(`Environment variable ${envVarName} is missing`);
  }
});

export const Config = {
  ENV: process.env.ENV ?? 'dev',
  APP_PORT: process.env.APP_PORT ?? 3000,
  NAMESPACES: process.env.NAMESPACES?.split(',') ?? ['default'], // default is the default namespace
  KIALI_SVC: process.env.KIALI_SVC ?? 'kiali',
  KIALI_NAMESPACE: process.env.KIALI_NAMESPACE ?? 'istio-system',
  PROMETHEUS_SVC: process.env.PROMETHEUS_SVC ?? 'prometheus',
  PROMETHEUS_NAMESPACE: process.env.PROMETHEUS_NAMESPACE ?? 'istio-system',
  CRONJOB_TIME: process.env.CRONJOB_TIME ?? '5',
};

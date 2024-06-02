import * as dotenv from 'dotenv';
dotenv.config();

// required environment variables
const requiredEnvVariables: Array<string> = ['ALL_CLUSTERS_IP', 'KIALI_PORT'];

requiredEnvVariables.forEach((envVarName: string) => {
  if (!process.env[envVarName]) {
    console.log(`Environment variable ${envVarName} is missing`);
  }
});

export const Config = {
  CLUSTERS_IP: '', //process.env.ALL_CLUSTERS_IP!.split(","),
  KIALI_PORT: '', // process.env.KIALI_PORT as string,
  ISTIO_IP: '', //process.env.ISTIO_IP as string,
  APP_PORT: process.env.APP_PORT ?? 3000,
};

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
  CLUSTERS_IP: '', //process.env.ALL_CLUSTERS_IP!.split(","),
  APP_PORT: process.env.APP_PORT ?? 3000,
  SCHEDULE_TIME: process.env.SCHEDULE_TIME ?? '30m', // this is the time that our app is running before scheduling
};

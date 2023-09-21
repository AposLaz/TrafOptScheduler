import * as dotenv from "dotenv";
dotenv.config();

// required environment variables
const requiredEnvVariables: Array<string> = ["ALL_CLUSTERS_IP"];

requiredEnvVariables.forEach((envVarName: string) => {
  if (!process.env[envVarName]) {
    throw new Error(`Environment variable ${envVarName} is missing`);
  }
});

export const Config = {
  CLUSTERS_IP: process.env.ALL_CLUSTERS_IP!.split(","),
};

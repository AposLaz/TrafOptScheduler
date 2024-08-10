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
  APP_PORT: process.env.APP_PORT ?? 3000,
};

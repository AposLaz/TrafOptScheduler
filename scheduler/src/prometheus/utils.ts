import axios from 'axios';

import { logger } from '../config/logger';

import type { PrometheusResponseType } from './types';

export const executePrometheusQuery = async (
  prometheusUrl: string,
  query: string
): Promise<PrometheusResponseType | undefined> => {
  try {
    const result = await axios.get<PrometheusResponseType>(
      `${prometheusUrl}/api/v1/query?query=${query}`
    );

    return result.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logger.error(`Error executing Prometheus query: ${query}`, {
        message: error.message,
        responseData: error.response?.data, // Avoid circular refs
        responseStatus: error.response?.status,
      });
    } else {
      logger.error(
        `Unexpected error executing Prometheus query: ${query}`,
        error
      );
    }

    return;
  }
};

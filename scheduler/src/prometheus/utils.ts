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
    logger.error(`Error executing Prometheus query: ${query}`, error);
    return;
  }
};

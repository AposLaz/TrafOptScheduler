import axios from 'axios';
import { GraphData } from './types';
import { logger } from '../../config/logger';
import { Config } from '../../config/config';

export class KialiService {
  async getKialiGraph(namespace: string) {
    const url = `http://${Config.istio.kiali.url}/kiali/api/namespaces/graph?graphType=workload&duration=${Config.CRONJOB_TIME}&namespaces=${namespace}&layout=dagre`;

    try {
      const response = await axios.get<GraphData>(url);
      return response.data;
    } catch (e: unknown) {
      const error = e as Error;
      logger.error(error);
      return undefined;
    }
  }
}

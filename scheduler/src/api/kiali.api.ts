import axios from 'axios';
import { GraphData } from '../types';
import { logger } from '../config/logger';

// TODO change time
class KialiApi {
  async getGraph(ip: string, namespace: string) {
    const url = `http://${ip}/kiali/api/namespaces/graph?edges=noEdgeLabels&graphType=service&unusedNodes=false&operationNodes=false&injectServiceNodes=true&duration=60s&refresh=15000&namespaces=${namespace}&layout=dagre`;

    try {
      const response = await axios.get<GraphData>(url);
      return response.data;
    } catch (e: unknown) {
      const error = e as Error;
      logger.error(error);
      return undefined;
    }
  }

  async getGraphMetrics(ip: string, namespace: string) {
    const url = `http://${ip}/kiali/api/namespaces/graph?graphType=workload&duration=10m&namespaces=${namespace}&layout=dagre`;

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

const kialiApi = new KialiApi();

export default kialiApi;

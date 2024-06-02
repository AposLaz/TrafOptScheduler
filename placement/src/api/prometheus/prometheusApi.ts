import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import axios from 'axios';
import {
  PrometheusFetchData_CPU_RAM,
  PrometheusTransformResults,
} from './types';
import { transformPrometheusSchemaToPodMetric } from './services';
import { logger } from '../../config/logger';

const promisifiedExecFile = promisify(execFile);

class PrometheusApi {
  async getPrometheusIpAddress(): Promise<string | undefined> {
    try {
      const command = `kubectl get ingress prometheus-ingress -n istio-system -o jsonpath='{.status.loadBalancer.ingress[0].ip}'`;
      const { stdout } = await promisifiedExecFile('bash', ['-c', command]);

      return stdout;
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('stderr:', error.message);
      return undefined;
    }
  }

  //fetch data every 2minutes
  async getPrometheusCPUusageForAllPodsInNamespace(
    ip: string,
    namespace: string
  ): Promise<PrometheusTransformResults[] | undefined> {
    try {
      const query = `sum (rate (container_cpu_usage_seconds_total{id!="/",namespace=~"${namespace}"}[2m])) by (pod)`;
      const result = await axios.get<PrometheusFetchData_CPU_RAM>(
        `http://${ip}/prometheus/api/v1/query?query=${query}`
      );

      if (result.data.data.result.length <= 0) {
        return [];
      }

      const transformSchemaForPrometheus =
        await transformPrometheusSchemaToPodMetric(result.data.data.result);

      return transformSchemaForPrometheus;
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('axiosErr:', error.message);
      return undefined;
    }
  }

  async getPrometheusRAMusageForAllPodsInNamespace(
    ip: string,
    namespace: string
  ): Promise<PrometheusTransformResults[] | undefined> {
    try {
      //get ram in gb for 2 min
      const query = `sum(rate(container_memory_working_set_bytes{id!="/",namespace=~"${namespace}"}[2m])) by (pod) / 1024^3`;
      const result = await axios.get<PrometheusFetchData_CPU_RAM>(
        `http://${ip}/prometheus/api/v1/query?query=${query}`
      );

      if (result.data.data.result.length <= 0) {
        return [];
      }

      const transformSchemaForPrometheus =
        await transformPrometheusSchemaToPodMetric(result.data.data.result);

      return transformSchemaForPrometheus;
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('axiosErr:', error.message);
      return undefined;
    }
  }
}

const prometheusApi = new PrometheusApi();
//gcp
//kubectl get ingress <ingress-name> -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
//aws
//kubectl get ingress <ingress-name> -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

export default prometheusApi;

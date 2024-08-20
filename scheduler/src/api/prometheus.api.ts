import axios from 'axios';
import { logger } from '../config/logger';
import {
  PrometheusFetchData_Istio_Metrics,
  PrometheusTransformResultsToIstioMetrics,
} from '../types';
import { Config } from '../config/config';
import { prometheusMapper } from '../mapper/prometheus.mapper';

const time = Config.CRONJOB_TIME;

export class PrometheusApi {
  /**
   * Fetches the sum of latency between all mutual TLS HTTP pods in the specified namespace from the Prometheus API.
   *
   * @param {string} namespace - The namespace in which to fetch the latency data.
   * @return {Promise<PrometheusTransformResultsToIstioMetrics[] | undefined>} - A promise that resolves to an array of
   * objects containing the source workload name, target workload name, replica pod name, and the sum of latency between pods,
   * or undefined if there was an error.
   */
  async getResponseTimeBetweenPods(
    ip: string,
    namespace: string
  ): Promise<PrometheusTransformResultsToIstioMetrics[] | undefined> {
    try {
      // Construct the Prometheus query to fetch the sum of response time between all mutual TLS HTTP pods
      // in the specified namespace.
      // The query filters the data to only include metrics where the connection security policy is mutual_tls,
      // the destination and source apps are not unknown, and the namespace matches the specified namespace.
      // The query also aggregates the data by pod, node, destination workload, and source workload.
      const query = `sum(rate(istio_request_duration_milliseconds_bucket{connection_security_policy = 'mutual_tls',destination_app != 'unknown',source_app != 'unknown',namespace='${namespace}'}[${time}m])) by (pod,node,destination_workload,source_workload)`;

      // Send a GET request to the Prometheus API to fetch the latency data.
      const result = await axios.get<PrometheusFetchData_Istio_Metrics>(
        `http://${ip}/api/v1/query?query=${query}`
      );

      // If there is no data returned by the API, return an empty array.
      if (result.data.data.result.length === 0) {
        return undefined;
      }

      // Transform the fetched data into a format suitable for further processing. The fetched data is transformed
      // into an array of objects containing the source workload name, target workload name, replica pod name, and the
      // sum of latency between pods.
      const transformSchemaForPrometheus = prometheusMapper.toIstioMetrics(
        result.data
      );

      // Return the transformed latency data.
      return transformSchemaForPrometheus;
    } catch (e: unknown) {
      // If there is an error during the process, log the error and return undefined.
      const error = e as Error;
      logger.error(error);
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

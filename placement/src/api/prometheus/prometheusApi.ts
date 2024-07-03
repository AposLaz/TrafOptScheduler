import axios from 'axios';
import {
  PrometheusFetchData_ISTIO_METRICS,
  PrometheusFetchData_NODE_CPU_MEMORY,
  PrometheusFetchData_POD_CPU_MEMORY,
  PrometheusTransformResultsByNode,
  PrometheusTransformResultsToIstioMetrics,
  PrometheusTransformResultsToNode,
} from './types';
import {
  transformPrometheusSchemaToIstioMetrics,
  transformPrometheusSchemaToNodeMetric,
  transformPrometheusSchemaToPodMetricByNode,
} from './services';
import { logger } from '../../config/logger';
import { setupConfigs } from '../..';

class PrometheusApi {
  /**
   * This function sends a GET request to the Prometheus API to fetch the total
   * CPU used by pods in each node.
   *
   * Returns:
   * - Promise<PrometheusTransformResultsToNode[] | undefined> - A promise that
   *   resolves to an array of objects containing the total CPU used by pods in
   *   each node. If the request to the Prometheus API is unsuccessful, the
   *   promise resolves to undefined.
   */
  async getTotalCpuUsedByPodsInEachNode(
    time: string
  ): Promise<PrometheusTransformResultsToNode[] | undefined> {
    try {
      // The query calculates the total CPU used by pods by summing the CPU
      // usage of all containers in each node. The 'rate' function calculates
      // the derivative of the given metric over time, which in this case is the
      // rate at which the CPU usage of the containers is changing. The '[time]'
      // specifies that the rate is calculated over a 10 minute interval.
      const query = `sum(rate(container_cpu_usage_seconds_total{container!='', pod!='', instance!=''}[${time}])) by (instance)`;

      // Send a GET request to the Prometheus API to fetch the data.
      const result = await axios.get<PrometheusFetchData_NODE_CPU_MEMORY>(
        `http://${setupConfigs.prometheusHost}/api/v1/query?query=${query}`
      );

      // If there is no data returned by the API, return an empty array.
      if (result.data.data.result.length <= 0) {
        return [];
      }

      // Transform the fetched data into a format suitable for further processing.
      // The fetched data is transformed into an array of objects containing the node name and the total CPU used by pods in that node.
      const transformSchemaForPrometheus =
        transformPrometheusSchemaToNodeMetric(result.data);

      // Return the transformed data.
      return transformSchemaForPrometheus;
    } catch (e: unknown) {
      // If there is an error during the process, log the error and return undefined.
      const error = e as Error;
      logger.error(error);
      return undefined;
    }
  }

  async getTotalMemoryUsedByPodsInEachNode(): Promise<
    PrometheusTransformResultsToNode[] | undefined
  > {
    try {
      const query = `sum(container_memory_usage_bytes{pod!='',container!='', instance!=''}) by (instance) / 1024^2`;
      const result = await axios.get<PrometheusFetchData_NODE_CPU_MEMORY>(
        `http://${setupConfigs.prometheusHost}/api/v1/query?query=${query}`
      );

      if (result.data.data.result.length <= 0) {
        return [];
      }

      const transformSchemaForPrometheus =
        transformPrometheusSchemaToNodeMetric(result.data);

      return transformSchemaForPrometheus;
    } catch (e: unknown) {
      const error = e as Error;
      logger.error(error);
      return undefined;
    }
  }

  async getTotalCpuUsedByPod(
    pod: string,
    ns: string,
    time: string
  ): Promise<number | undefined> {
    try {
      const query = `sum(rate(container_cpu_usage_seconds_total{container!='', pod='${pod}', instance!='', namespace='${ns}'}[${time}]))`;
      const result = await axios.get<PrometheusFetchData_POD_CPU_MEMORY>(
        `http://${setupConfigs.prometheusHost}/api/v1/query?query=${query}`
      );

      if (result.data.data.result.length <= 0) {
        return;
      }

      return parseFloat(Number(result.data.data.result[0].value[1]).toFixed(3));
    } catch (e: unknown) {
      const error = e as Error;
      logger.error(error);
      return undefined;
    }
  }

  async getTotalMemoryUsedByPod(
    pod: string,
    ns: string
  ): Promise<number | undefined> {
    try {
      const query = `sum(container_memory_usage_bytes{pod='${pod}',container!='', instance!='', namespace='${ns}'}) / 1024^2`;
      const result = await axios.get<PrometheusFetchData_POD_CPU_MEMORY>(
        `http://${setupConfigs.prometheusHost}/api/v1/query?query=${query}`
      );

      if (result.data.data.result.length <= 0) {
        return;
      }

      return parseFloat(Number(result.data.data.result[0].value[1]).toFixed(3));
    } catch (e: unknown) {
      const error = e as Error;
      logger.error(error);
      return undefined;
    }
  }

  // This function fetches CPU usage requested by pods on all nodes from Prometheus API.
  //
  // Returns:
  // - Promise<PrometheusTransformResultsToNode[] | undefined> - A promise that resolves to an array of objects
  //   containing CPU usage requested by pods on all nodes. If the request to Prometheus API is unsuccessful, the
  //   promise resolves to undefined.
  async getNodesCpuRequestedByPods(): Promise<
    PrometheusTransformResultsToNode[] | undefined
  > {
    try {
      const query = `sum(kube_pod_container_resource_requests{resource='cpu',node!=''}) by (node)`;

      // Send a GET request to the Prometheus API to fetch the data.
      const result = await axios.get<PrometheusFetchData_NODE_CPU_MEMORY>(
        `http://${setupConfigs.prometheusHost}/api/v1/query?query=${query}`
      );

      // If there is no data returned by the API, return an empty array.
      if (result.data.data.result.length <= 0) {
        return [];
      }

      // Transform the fetched data into a format suitable for further processing.
      const transformSchemaForPrometheus =
        transformPrometheusSchemaToNodeMetric(result.data);

      // Return the transformed data.
      return transformSchemaForPrometheus;
    } catch (e: unknown) {
      // If there is an error during the process, log the error and return undefined.
      const error = e as Error;
      logger.error(error);
      return undefined;
    }
  }

  // This function fetches the amount of memory requested by pods on all nodes from the Prometheus API.
  //
  // Returns:
  // - Promise<PrometheusTransformResultsToNode[] | undefined> - A promise that resolves to an array of objects
  //   containing the amount of memory requested by pods on all nodes. If the request to the Prometheus API is
  //   unsuccessful, the promise resolves to undefined.
  async getNodesMemoryRequestedByPods(): Promise<
    PrometheusTransformResultsToNode[] | undefined
  > {
    try {
      const query = `sum(kube_pod_container_resource_requests{resource='memory',node!=''}) by (node) / 1024^2`;

      // Send a GET request to the Prometheus API to fetch the data.
      const result = await axios.get<PrometheusFetchData_NODE_CPU_MEMORY>(
        `http://${setupConfigs.prometheusHost}/api/v1/query?query=${query}`
      );

      // If there is no data returned by the API, return an empty array.
      if (result.data.data.result.length <= 0) {
        return [];
      }

      // Transform the fetched data into a format suitable for further processing.
      // The fetched data is transformed into an array of objects containing the node name and the amount of memory
      // requested by pods on that node.
      const transformSchemaForPrometheus =
        transformPrometheusSchemaToNodeMetric(result.data);

      // Return the transformed data.
      return transformSchemaForPrometheus;
    } catch (e: unknown) {
      // If there is an error during the process, log the error and return undefined.
      const error = e as Error;
      logger.error(error);
      return undefined;
    }
  }

  async getRequestedCpuByPod(
    pod: string,
    ns: string
  ): Promise<number | undefined> {
    try {
      const query = `sum(kube_pod_container_resource_requests{resource='cpu',node!='',pod='${pod}',namespace='${ns}'})`;

      // Send a GET request to the Prometheus API to fetch the data.
      const result = await axios.get<PrometheusFetchData_POD_CPU_MEMORY>(
        `http://${setupConfigs.prometheusHost}/api/v1/query?query=${query}`
      );

      // If there is no data returned by the API, return an empty array.
      if (result.data.data.result.length <= 0) {
        return;
      }

      // Return the transformed data.
      return parseFloat(Number(result.data.data.result[0].value[1]).toFixed(3));
    } catch (e: unknown) {
      // If there is an error during the process, log the error and return undefined.
      const error = e as Error;
      logger.error(error);
      return undefined;
    }
  }

  async getRequestedMemoryByPod(
    pod: string,
    ns: string
  ): Promise<number | undefined> {
    try {
      const query = `sum(kube_pod_container_resource_requests{resource='memory',node!='',pod='${pod}',namespace='${ns}'}) / 1024^2`;

      // Send a GET request to the Prometheus API to fetch the data.
      const result = await axios.get<PrometheusFetchData_POD_CPU_MEMORY>(
        `http://${setupConfigs.prometheusHost}/api/v1/query?query=${query}`
      );

      // If there is no data returned by the API, return an empty array.
      if (result.data.data.result.length <= 0) {
        return;
      }

      // Return the transformed data.
      return parseFloat(Number(result.data.data.result[0].value[1]).toFixed(3));
    } catch (e: unknown) {
      // If there is an error during the process, log the error and return undefined.
      const error = e as Error;
      logger.error(error);
      return undefined;
    }
  }

  // This function sends a GET request to the Prometheus API to fetch the amount of CPU allocated to pods on all nodes.
  //
  // Returns:
  // - Promise<PrometheusTransformResultsToNode[] | undefined> - A promise that resolves to an array of objects
  //   containing the amount of CPU allocated to pods on all nodes. If the request to the Prometheus API is
  //   unsuccessful, the promise resolves to undefined.
  async getNodesAllocateCpuForPods(): Promise<
    PrometheusTransformResultsToNode[] | undefined
  > {
    try {
      const query = `kube_node_status_allocatable{resource='cpu'}`;
      const result = await axios.get<PrometheusFetchData_NODE_CPU_MEMORY>(
        `http://${setupConfigs.prometheusHost}/api/v1/query?query=${query}`
      );

      // If there is no data returned by the API, return an empty array.
      if (result.data.data.result.length <= 0) {
        return [];
      }

      // Transform the fetched data into a format suitable for further processing.
      // The fetched data is transformed into an array of objects containing the node name and the amount of CPU
      // allocated to pods on that node.
      const transformSchemaForPrometheus =
        transformPrometheusSchemaToNodeMetric(result.data);

      // Return the transformed data.
      return transformSchemaForPrometheus;
    } catch (e: unknown) {
      // If there is an error during the process, log the error and return undefined.
      const error = e as Error;
      logger.error(error);
      return undefined;
    }
  }

  /**
   * This function sends a GET request to the Prometheus API to fetch the amount of memory allocated to pods on all nodes.
   *
   * Returns:
   * - Promise<PrometheusTransformResultsToNode[] | undefined> - A promise that resolves to an array of objects
   *   containing the amount of memory allocated to pods on all nodes. If the request to the Prometheus API is
   *   unsuccessful, the promise resolves to undefined.
   */
  async getNodesAllocateMemoryForPods(): Promise<
    PrometheusTransformResultsToNode[] | undefined
  > {
    try {
      // The query calculates the amount of memory allocated to pods by dividing the total amount of memory
      // available on each node by 1024^2 (which converts the value to megabytes).
      const query = `kube_node_status_allocatable{resource='memory'} / 1024^2`;

      // Send a GET request to the Prometheus API to fetch the data.
      const result = await axios.get<PrometheusFetchData_NODE_CPU_MEMORY>(
        `http://${setupConfigs.prometheusHost}/api/v1/query?query=${query}`
      );

      // If there is no data returned by the API, return an empty array.
      if (result.data.data.result.length <= 0) {
        return [];
      }

      // Transform the fetched data into a format suitable for further processing.
      // The fetched data is transformed into an array of objects containing the node name and the amount of memory
      // allocated to pods on that node.
      const transformSchemaForPrometheus =
        transformPrometheusSchemaToNodeMetric(result.data);

      // Return the transformed data.
      return transformSchemaForPrometheus;
    } catch (e: unknown) {
      // If there is an error during the process, log the error and return undefined.
      const error = e as Error;
      logger.error(error);
      return undefined;
    }
  }

  //--------------------------------------------- Pods --------------------------------------

  /**
   * This function fetches the amount of CPU requested by pods in a specified namespace from the Prometheus API.
   *
   * @param {string} namespace - The namespace in which to fetch the CPU requests.
   * @return {Promise<PrometheusTransformResultsByNode[] | undefined>} A promise that resolves to an array of objects
   * containing the amount of CPU requested by pods in the specified namespace. If the request to the Prometheus API is
   * unsuccessful, the promise resolves to undefined.
   */
  async getPodsRequestedCpuByNs(
    namespace: string
  ): Promise<PrometheusTransformResultsByNode[] | undefined> {
    try {
      // requests made by all pods in the specified namespace and groups the results by pod and node.
      const query = `sum(kube_pod_container_resource_requests{resource='cpu',namespace='${namespace}',node!='',pod!=''}) by (pod,node)`;

      // Send a GET request to the Prometheus API to fetch the data.
      const result = await axios.get<PrometheusFetchData_POD_CPU_MEMORY>(
        `http://${setupConfigs.prometheusHost}/api/v1/query?query=${query}`
      );

      // If there is no data returned by the API, return an empty array.
      if (result.data.data.result.length <= 0) {
        return [];
      }

      // Transform the fetched data into a format suitable for further processing. The fetched data is transformed
      // into an array of objects containing the pod name, node name, and the amount of CPU requested by the pod.
      const transformSchemaForPrometheus =
        transformPrometheusSchemaToPodMetricByNode(result.data.data.result);

      // Round the metric value to 2 decimal places and return the transformed data.
      const returnData = transformSchemaForPrometheus.map((data) => ({
        ...data,
        metric: parseFloat(data.metric.toFixed(2)),
      }));

      return returnData;
    } catch (e: unknown) {
      // If there is an error during the process, log the error and return undefined.
      const error = e as Error;
      logger.error(error);
      return undefined;
    }
  }

  /**
   * Fetches the amount of memory requested by all pods in a specified namespace from the Prometheus API and
   * transforms the fetched data into a format suitable for further processing.
   *
   * @param {string} namespace - The name of the namespace for which to fetch the memory usage data.
   * @return {Promise<PrometheusTransformResultsByNode[] | undefined>} - A promise that resolves to an array of objects
   * containing the pod name, node name, and the amount of memory requested by the pod. If the operation is
   * unsuccessful, the promise resolves to undefined.
   */
  async getPodsRequestedMemoryByNs(
    namespace: string
  ): Promise<PrometheusTransformResultsByNode[] | undefined> {
    try {
      // The query groups the results by pod and node.
      const query = `sum(kube_pod_container_resource_requests{resource='memory',namespace='${namespace}',node!='',pod!=''}) by (pod,node) / 1024^2`;

      // Sends a GET request to the Prometheus API to fetch the data.
      const result = await axios.get<PrometheusFetchData_POD_CPU_MEMORY>(
        `http://${setupConfigs.prometheusHost}/api/v1/query?query=${query}`
      );

      // If there is no data returned by the API, return an empty array.
      if (result.data.data.result.length <= 0) {
        return [];
      }

      // Transforms the fetched data into a format suitable for further processing. The fetched data is transformed
      // into an array of objects containing the pod name, node name, and the amount of memory requested by the pod.
      const transformSchemaForPrometheus =
        transformPrometheusSchemaToPodMetricByNode(result.data.data.result);

      // Returns the transformed data.
      return transformSchemaForPrometheus;
    } catch (e: unknown) {
      // If there is an error during the process, log the error and return undefined.
      const error = e as Error;
      logger.error(error);
      return undefined;
    }
  }

  /**
   * Fetches the CPU usage of all pods in a specified namespace from the Prometheus API.
   *
   * @param {string} namespace - The name of the namespace for which to fetch the CPU usage data.
   * @return {Promise<PrometheusTransformResultsByNode[] | undefined>} - A promise that resolves to an array of objects
   * containing the pod name, node name, and the CPU usage of the pod. If the operation is
   * unsuccessful, the promise resolves to undefined.
   */
  async getPodsCpuUsageByNs(
    namespace: string,
    time: string
  ): Promise<PrometheusTransformResultsByNode[] | undefined> {
    try {
      const query = `avg(rate(container_cpu_usage_seconds_total{namespace='${namespace}',instance!='',pod!=''}[${time}])) by (pod,instance)`;

      // Sends a GET request to the Prometheus API to fetch the CPU usage data.
      const result = await axios.get<PrometheusFetchData_POD_CPU_MEMORY>(
        `http://${setupConfigs.prometheusHost}/api/v1/query?query=${query}`
      );

      // If there is no data returned by the API, return an empty array.
      if (result.data.data.result.length <= 0) {
        return [];
      }

      // Transforms the fetched data into a format suitable for further processing. The fetched data is transformed
      // into an array of objects containing the pod name, node name, and the CPU usage of the pod.
      const transformSchemaForPrometheus =
        transformPrometheusSchemaToPodMetricByNode(result.data.data.result);

      // Rounds the CPU usage to two decimal places.
      const returnData = transformSchemaForPrometheus.map((data) => ({
        ...data,
        metric: parseFloat(data.metric.toFixed(2)),
      }));

      // Returns the transformed and rounded CPU usage data.
      return returnData;
    } catch (e: unknown) {
      // If there is an error during the process, log the error and return undefined.
      const error = e as Error;
      logger.error(error);
      return undefined;
    }
  }

  /**
   * Fetches the memory usage of all pods in the specified namespace from Prometheus and returns the data in a
   * transformed format.
   *
   * @param {string} namespace - The namespace in which to fetch the memory usage data.
   * @return {Promise<PrometheusTransformResultsByNode[] | undefined>} - A promise that resolves to an array of objects
   * containing the pod name, node name, and the memory usage of the pod, or undefined if there was an error.
   */
  async getPodsMemoryUsageByNs(
    namespace: string,
    time: string
  ): Promise<PrometheusTransformResultsByNode[] | undefined> {
    try {
      const query = `avg(rate(container_memory_max_usage_bytes{namespace='${namespace}',instance!='',pod!=''}[${time}])) by (pod,instance) / 1024^2`;

      // Sends a GET request to the Prometheus API to fetch the memory usage data.
      const result = await axios.get<PrometheusFetchData_POD_CPU_MEMORY>(
        `http://${setupConfigs.prometheusHost}/api/v1/query?query=${query}`
      );

      // If there is no data returned by the API, return an empty array.
      if (result.data.data.result.length <= 0) {
        return [];
      }

      // Transforms the fetched data into a format suitable for further processing. The fetched data is transformed
      // into an array of objects containing the pod name, node name, and the memory usage of the pod.
      const transformSchemaForPrometheus =
        transformPrometheusSchemaToPodMetricByNode(result.data.data.result);

      // Returns the transformed memory usage data.
      return transformSchemaForPrometheus;
    } catch (e: unknown) {
      // If there is an error during the process, log the error and return undefined.
      const error = e as Error;
      logger.error(error);
      return undefined;
    }
  }

  /**
   * Fetches the sum of request bytes sent by all pods in the specified namespace from Prometheus and returns the
   * data in a transformed format.
   *
   * @param {string} namespace - The namespace in which to fetch the request bytes data.
   * @return {Promise<PrometheusTransformResultsToIstioMetrics[] | undefined>} - A promise that resolves to an array of
   * objects containing the source and target workload names, replica pod name, and the sum of request bytes sent, or
   * undefined if there was an error.
   */
  async getHttpPodsRequestBytesSumByNs(
    namespace: string,
    time: string
  ): Promise<PrometheusTransformResultsToIstioMetrics[] | undefined> {
    try {
      // The Prometheus query fetches the sum of request bytes sent by all pods in the specified namespace, with the
      // following conditions:
      // - The connection security policy is mutual TLS.
      // - The response code is 200.
      // - The source and destination apps are not unknown.
      const query = `rate(istio_request_bytes_sum{connection_security_policy = 'mutual_tls', response_code="200",source_app != 'unknown',  destination_app != 'unknown', namespace='${namespace}'}[${time}])`;

      // Sends a GET request to the Prometheus API to fetch the request bytes data.
      const result = await axios.get<PrometheusFetchData_ISTIO_METRICS>(
        `http://${setupConfigs.prometheusHost}/api/v1/query?query=${query}`
      );

      // If there is no data returned by the API, return an empty array.
      if (result.data.data.result.length <= 0) {
        return [];
      }

      // Transforms the fetched data into a format suitable for further processing. The fetched data is transformed
      // into an array of objects containing the source workload name, target workload name, replica pod name, and the
      // sum of request bytes sent.
      const transformSchemaForPrometheus =
        transformPrometheusSchemaToIstioMetrics(result.data);

      // Returns the transformed request bytes data.
      return transformSchemaForPrometheus;
    } catch (e: unknown) {
      // If there is an error during the process, log the error and return undefined.
      const error = e as Error;
      logger.error(error);
      return undefined;
    }
  }

  /**
   * Fetches the sum of response bytes received by all pods in the specified namespace from Prometheus and returns the
   * data in a transformed format.
   *
   * @param {string} namespace - The namespace in which to fetch the response bytes data.
   * @return {Promise<PrometheusTransformResultsToIstioMetrics[] | undefined>} - A promise that resolves to an array of
   * objects containing the source and target workload names, replica pod name, and the sum of response bytes received,
   * or undefined if there was an error.
   */
  async getHttpPodsResponseBytesSumByNs(
    namespace: string,
    time: string
  ): Promise<PrometheusTransformResultsToIstioMetrics[] | undefined> {
    try {
      // The Prometheus query fetches the sum of response bytes received by all pods in the specified namespace, with the
      // following conditions:
      // - The connection security policy is mutual TLS.
      // - The response code is 200.
      // - The source and destination apps are not unknown.
      const query = `rate(istio_response_bytes_sum{connection_security_policy = 'mutual_tls', response_code="200",source_app != 'unknown',  destination_app != 'unknown', namespace='${namespace}'}[${time}])`;

      // Sends a GET request to the Prometheus API to fetch the response bytes data.
      const result = await axios.get<PrometheusFetchData_ISTIO_METRICS>(
        `http://${setupConfigs.prometheusHost}/api/v1/query?query=${query}`
      );

      // If there is no data returned by the API, return an empty array.
      if (result.data.data.result.length <= 0) {
        return [];
      }

      // Transforms the fetched data into a format suitable for further processing. The fetched data is transformed
      // into an array of objects containing the source workload name, target workload name, replica pod name, and the
      // sum of response bytes received.
      const transformSchemaForPrometheus =
        transformPrometheusSchemaToIstioMetrics(result.data);

      // Returns the transformed response bytes data.
      return transformSchemaForPrometheus;
    } catch (e: unknown) {
      // If there is an error during the process, log the error and return undefined.
      const error = e as Error;
      logger.error(error);
      return undefined;
    }
  }

  /**
   * This function fetches the sum of request bytes sent by all TCP pods in the specified namespace.
   * This is useful for monitoring database traffic.
   * It uses the Prometheus API to query data and then transforms the fetched data into a format suitable
   * for further processing. The fetched data includes the source workload name, target workload name,
   * replica pod name, and the sum of request bytes sent.
   *
   * @param {string} namespace - The name of the namespace where the pods are located.
   * @return {Promise<PrometheusTransformResultsToIstioMetrics[] | undefined>} - An array of objects containing the source workload name, target workload name,
   * replica pod name, and the sum of request bytes sent, or undefined if there was an error.
   */
  async getTcpPodsRequestBytesSumByNs(
    namespace: string,
    time: string
  ): Promise<PrometheusTransformResultsToIstioMetrics[] | undefined> {
    try {
      // The Prometheus query fetches the sum of request bytes sent by all TCP pods in the specified namespace, with the
      // following conditions:
      // - The connection security policy is mutual TLS.
      // - The source and destination apps are not unknown.
      const query = `rate(istio_tcp_sent_bytes_total{connection_security_policy = 'mutual_tls', source_app != 'unknown',  destination_app != 'unknown', namespace='${namespace}'}[${time}])`;

      // Sends a GET request to the Prometheus API to fetch the request bytes data.
      const result = await axios.get<PrometheusFetchData_ISTIO_METRICS>(
        `http://${setupConfigs.prometheusHost}/api/v1/query?query=${query}`
      );

      // If there is no data returned by the API, return an empty array.
      if (result.data.data.result.length <= 0) {
        return [];
      }

      // Transforms the fetched data into a format suitable for further processing. The fetched data is transformed
      // into an array of objects containing the source workload name, target workload name, replica pod name, and the
      // sum of request bytes sent.
      const transformSchemaForPrometheus =
        transformPrometheusSchemaToIstioMetrics(result.data);

      // Returns the transformed request bytes data.
      return transformSchemaForPrometheus;
    } catch (e: unknown) {
      // If there is an error during the process, log the error and return undefined.
      const error = e as Error;
      logger.error(error);
      return undefined;
    }
  }

  /**
   * This function fetches the sum of response bytes sent by all TCP pods in the specified namespace.
   * This is useful for monitoring database traffic.
   *
   * @param {string} namespace - The name of the namespace where the TCP pods are located.
   * @return {Promise<PrometheusTransformResultsToIstioMetrics[] | undefined>} - An array of objects containing the source workload name, target workload name,
   * replica pod name, and the sum of response bytes sent, or undefined if there was an error.
   */
  async getTcpPodsResponseBytesSumByNs(
    namespace: string,
    time: string
  ): Promise<PrometheusTransformResultsToIstioMetrics[] | undefined> {
    try {
      // We use the Prometheus API to query data. The query fetches the sum of response bytes sent by all TCP pods in the specified namespace, with the
      // following conditions:
      // - The connection security policy is mutual TLS.
      // - The source and destination apps are not unknown.
      // We use the `rate` function to calculate the rate of change of the response bytes over a 10 minute time window.
      const query = `rate(istio_tcp_received_bytes_total{connection_security_policy = 'mutual_tls', source_app != 'unknown',  destination_app != 'unknown', namespace='${namespace}'}[${time}])`;

      // Sends a GET request to the Prometheus API to fetch the response bytes data.
      const result = await axios.get<PrometheusFetchData_ISTIO_METRICS>(
        `http://${setupConfigs.prometheusHost}/api/v1/query?query=${query}`
      );

      // If there is no data returned by the API, return an empty array.
      if (result.data.data.result.length <= 0) {
        return [];
      }

      // Transforms the fetched data into a format suitable for further processing. The fetched data is transformed
      // into an array of objects containing the source workload name, target workload name, replica pod name, and the
      // sum of response bytes sent.
      const transformSchemaForPrometheus =
        transformPrometheusSchemaToIstioMetrics(result.data);

      // Returns the transformed response bytes data.
      return transformSchemaForPrometheus;
    } catch (e: unknown) {
      // If there is an error during the process, log the error and return undefined.
      const error = e as Error;
      logger.error(error);
      return undefined;
    }
  }

  /**
   * This function sends a GET request to the Prometheus API to fetch the sum of request bytes sent by all HTTP pods in the specified namespace, with the
   * following conditions:
   * - The connection security policy is mutual TLS.
   * - The response code is 200.
   * - The source and destination apps are not unknown.
   * The function calculates the rate of change of the request bytes over a 10 minute time window.
   * If there is no data returned by the API, the function returns an empty array.
   * If there is an error during the process, the function logs the error and returns undefined.
   *
   * @param namespace - The namespace of the pods to fetch the request bytes data for.
   * @returns An array of objects containing the source workload name, target workload name, replica pod name, and the sum of request bytes sent, or undefined if there was an error.
   */
  async getHttpPodsRequestBytesCountByNs(
    namespace: string,
    time: string
  ): Promise<PrometheusTransformResultsToIstioMetrics[] | undefined> {
    try {
      // Construct the Prometheus query to fetch the sum of request bytes sent by all HTTP pods in the specified namespace.
      const query = `rate(istio_request_bytes_count{connection_security_policy = 'mutual_tls', response_code="200",source_app != 'unknown',  destination_app != 'unknown', namespace='${namespace}'}[${time}])`;

      // Send a GET request to the Prometheus API to fetch the request bytes data.
      const result = await axios.get<PrometheusFetchData_ISTIO_METRICS>(
        `http://${setupConfigs.prometheusHost}/api/v1/query?query=${query}`
      );

      // If there is no data returned by the API, return an empty array.
      if (result.data.data.result.length <= 0) {
        return [];
      }

      // Transform the fetched data into a format suitable for further processing. The fetched data is transformed
      // into an array of objects containing the source workload name, target workload name, replica pod name, and the
      // sum of request bytes sent.
      const transformSchemaForPrometheus =
        transformPrometheusSchemaToIstioMetrics(result.data);

      // Return the transformed request bytes data.
      return transformSchemaForPrometheus;
    } catch (e: unknown) {
      // If there is an error during the process, log the error and return undefined.
      const error = e as Error;
      logger.error(error);
      return undefined;
    }
  }

  /**
   * Fetches the sum of response bytes sent by all HTTP pods in the specified namespace from the Prometheus API.
   *
   * @param namespace - The namespace of the pods to fetch the response bytes data for.
   * @returns An array of objects containing the source workload name, target workload name, replica pod name, and the sum of response bytes sent, or undefined if there was an error.
   */
  async getHttpPodsResponseBytesCountByNs(
    namespace: string,
    time: string
  ): Promise<PrometheusTransformResultsToIstioMetrics[] | undefined> {
    try {
      // Construct the Prometheus query to fetch the sum of response bytes sent by all HTTP pods in the specified namespace.
      // The query filters the data to only include metrics where the connection security policy is mutual_tls, the response code is 200,
      // the source and destination apps are not unknown, and the namespace matches the specified namespace.
      const query = `rate(istio_response_bytes_count{connection_security_policy = 'mutual_tls', response_code="200",source_app != 'unknown',  destination_app != 'unknown', namespace='${namespace}'}[${time}])`;

      // Send a GET request to the Prometheus API to fetch the response bytes data.
      const result = await axios.get<PrometheusFetchData_ISTIO_METRICS>(
        `http://${setupConfigs.prometheusHost}/api/v1/query?query=${query}`
      );

      // If there is no data returned by the API, return an empty array.
      if (result.data.data.result.length <= 0) {
        return [];
      }

      // Transform the fetched data into a format suitable for further processing. The fetched data is transformed
      // into an array of objects containing the source workload name, target workload name, replica pod name, and the
      // sum of response bytes sent.
      const transformSchemaForPrometheus =
        transformPrometheusSchemaToIstioMetrics(result.data);

      // Return the transformed response bytes data.
      return transformSchemaForPrometheus;
    } catch (e: unknown) {
      // If there is an error during the process, log the error and return undefined.
      const error = e as Error;
      logger.error(error);
      return undefined;
    }
  }

  /**
   * This function sends a GET request to the Prometheus API to fetch the sum of request messages sent by all
   * HTTP pods in the specified namespace, with the following conditions:
   * - The source and destination apps are not unknown.
   * - The namespace matches the specified namespace.
   * The function calculates the increase in the total number of request messages over a 10 minute time window.
   * If there is no data returned by the API, the function returns an empty array.
   * If there is an error during the process, the function logs the error and returns undefined.
   *
   * @param namespace - The namespace of the pods to fetch the request message data for.
   * @returns An array of objects containing the source workload name, target workload name, replica pod name, and the sum of request messages sent, or undefined if there was an error.
   */
  async getRequestMessagesByNs(
    namespace: string,
    time: string
  ): Promise<PrometheusTransformResultsToIstioMetrics[] | undefined> {
    try {
      // Construct the Prometheus query to fetch the sum of request messages sent by all HTTP pods in the specified namespace.
      const query = `sum(ceil(increase(istio_request_messages_total{source_app != 'unknown', destination_app != 'unknown', namespace='${namespace}'}[${time}]))) by (pod,node,source_workload,destination_workload)`;

      // Send a GET request to the Prometheus API to fetch the request message data.
      const result = await axios.get<PrometheusFetchData_ISTIO_METRICS>(
        `http://${setupConfigs.prometheusHost}/api/v1/query?query=${query}`
      );

      // If there is no data returned by the API, return an empty array.
      if (result.data.data.result.length <= 0) {
        return [];
      }

      // Transform the fetched data into a format suitable for further processing. The fetched data is transformed
      // into an array of objects containing the source workload name, target workload name, replica pod name, and the
      // sum of request messages sent.
      const transformSchemaForPrometheus =
        transformPrometheusSchemaToIstioMetrics(result.data);

      // Return the transformed request message data.
      return transformSchemaForPrometheus;
    } catch (e: unknown) {
      // If there is an error during the process, log the error and return undefined.
      const error = e as Error;
      logger.error(error);
      return undefined;
    }
  }

  /**
   * Fetches the sum of response messages sent by all HTTP pods in the specified namespace from Prometheus and returns the
   * data in a transformed format.
   *
   * @param {string} namespace - The namespace in which to fetch the response message data.
   * @return {Promise<PrometheusTransformResultsToIstioMetrics[] | undefined>} - A promise that resolves to an array of
   * objects containing the source workload name, target workload name, replica pod name, and the sum of response messages sent,
   * or undefined if there was an error.
   */
  async getResponseMessagesByNs(
    namespace: string,
    time: string
  ): Promise<PrometheusTransformResultsToIstioMetrics[] | undefined> {
    try {
      // Construct the Prometheus query to fetch the sum of response messages sent by all HTTP pods in the specified namespace.
      const query = `sum(ceil(increase(istio_response_messages_total{source_app != 'unknown', destination_app != 'unknown', namespace='${namespace}'}[${time}]))) by (pod,node,source_workload,destination_workload)`;

      // Send a GET request to the Prometheus API to fetch the response message data.
      const result = await axios.get<PrometheusFetchData_ISTIO_METRICS>(
        `http://${setupConfigs.prometheusHost}/api/v1/query?query=${query}`
      );

      // If there is no data returned by the API, return an empty array.
      if (result.data.data.result.length <= 0) {
        return [];
      }

      // Transform the fetched data into a format suitable for further processing. The fetched data is transformed
      // into an array of objects containing the source workload name, target workload name, replica pod name, and the
      // sum of response messages sent.
      const transformSchemaForPrometheus =
        transformPrometheusSchemaToIstioMetrics(result.data);

      // Return the transformed response message data.
      return transformSchemaForPrometheus;
    } catch (e: unknown) {
      // If there is an error during the process, log the error and return undefined.
      const error = e as Error;
      logger.error('axiosErr:', error.message);
      return undefined;
    }
  }

  /**
   * Fetches the sum of TCP connections opened by all mutual TLS HTTP pods in the specified namespace,
   * using the Prometheus API.
   *
   * @param {string} namespace - The namespace in which to fetch the TCP connection data.
   * @return {Promise<PrometheusTransformResultsToIstioMetrics[] | undefined>} - A promise that resolves to an array of
   * objects containing the source workload name, target workload name, replica pod name, and the sum of TCP connections opened,
   * or undefined if there was an error.
   */
  async getTcpConnectionsByNs(
    namespace: string
  ): Promise<PrometheusTransformResultsToIstioMetrics[] | undefined> {
    try {
      // Construct the Prometheus query to fetch the sum of TCP connections opened by all mutual TLS HTTP pods
      // in the specified namespace.
      const query = `sum(ceil(increase(istio_tcp_connections_opened_total{connection_security_policy = 'mutual_tls', source_app != 'unknown',  destination_app != 'unknown', namespace='${namespace}'}[1h]))) by (pod,node,source_workload,destination_workload)`;

      // Send a GET request to the Prometheus API to fetch the TCP connection data.
      const result = await axios.get<PrometheusFetchData_ISTIO_METRICS>(
        `http://${setupConfigs.prometheusHost}/api/v1/query?query=${query}`
      );

      // If there is no data returned by the API, return an empty array.
      if (result.data.data.result.length <= 0) {
        return [];
      }

      // Transform the fetched data into a format suitable for further processing. The fetched data is transformed
      // into an array of objects containing the source workload name, target workload name, replica pod name, and the
      // sum of TCP connections opened.
      const transformSchemaForPrometheus =
        transformPrometheusSchemaToIstioMetrics(result.data);

      // Return the transformed TCP connection data.
      return transformSchemaForPrometheus;
    } catch (e: unknown) {
      // If there is an error during the process, log the error and return undefined.
      const error = e as Error;
      logger.error(error);
      return undefined;
    }
  }

  /**
   * Fetches the sum of latency between all mutual TLS HTTP pods in the specified namespace from the Prometheus API.
   *
   * @param {string} namespace - The namespace in which to fetch the latency data.
   * @return {Promise<PrometheusTransformResultsToIstioMetrics[] | undefined>} - A promise that resolves to an array of
   * objects containing the source workload name, target workload name, replica pod name, and the sum of latency between pods,
   * or undefined if there was an error.
   */
  async getLatencyBetweenPods(
    namespace: string,
    time: string
  ): Promise<PrometheusTransformResultsToIstioMetrics[] | undefined> {
    try {
      // Construct the Prometheus query to fetch the sum of latency between all mutual TLS HTTP pods
      // in the specified namespace.
      // The query filters the data to only include metrics where the connection security policy is mutual_tls,
      // the destination and source apps are not unknown, and the namespace matches the specified namespace.
      // The query also aggregates the data by pod, node, destination workload, and source workload.
      const query = `sum(rate(istio_request_duration_milliseconds_bucket{connection_security_policy = 'mutual_tls',destination_app != 'unknown',source_app != 'unknown',namespace='${namespace}'}[${time}])) by (pod,node,destination_workload,source_workload)`;

      // Send a GET request to the Prometheus API to fetch the latency data.
      const result = await axios.get<PrometheusFetchData_ISTIO_METRICS>(
        `http://${setupConfigs.prometheusHost}/api/v1/query?query=${query}`
      );

      // If there is no data returned by the API, return an empty array.
      if (result.data.data.result.length <= 0) {
        return [];
      }

      // Transform the fetched data into a format suitable for further processing. The fetched data is transformed
      // into an array of objects containing the source workload name, target workload name, replica pod name, and the
      // sum of latency between pods.
      const transformSchemaForPrometheus =
        transformPrometheusSchemaToIstioMetrics(result.data);

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

/** 
  Typical Usage:
  --------------
  Sum Bytes: Useful for understanding the total data transfer over time.
  Count Bytes: Useful for counting the volume or frequency of data transfers.

  Aggregation:
  --------------
  Sum Bytes: Adds up the total size of all the bytes sent or received.
  Count Bytes: Counts each byte in the transfer, useful for understanding data volume.
 */

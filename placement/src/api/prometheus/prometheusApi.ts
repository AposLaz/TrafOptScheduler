import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import axios from 'axios';
import {
  PrometheusFetchData_NODE_CPU_MEMORY,
  PrometheusFetchData_POD_CPU_MEMORY,
  PrometheusTransformResults,
  PrometheusTransformResultsByNode,
  PrometheusTransformResultsToNode,
} from './types';
import {
  transformPrometheusSchemaToNodeMetric,
  transformPrometheusSchemaToPodMetric,
  transformPrometheusSchemaToPodMetricByNode,
} from './services';
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
      const result = await axios.get<PrometheusFetchData_POD_CPU_MEMORY>(
        `http://${ip}/prometheus/api/v1/query?query=${query}`
      );

      if (result.data.data.result.length <= 0) {
        return [];
      }

      const transformSchemaForPrometheus = transformPrometheusSchemaToPodMetric(
        result.data.data.result
      );

      return transformSchemaForPrometheus;
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('axiosErr:', error.message);
      return undefined;
    }
  }

  async getPrometheusMemoryusageForAllPodsInNamespace(
    ip: string,
    namespace: string
  ): Promise<PrometheusTransformResults[] | undefined> {
    try {
      //get Memory in gb for 2 min
      const query = `sum(rate(container_memory_working_set_bytes{id!="/",namespace=~"${namespace}"}[2m])) by (pod) / 1024^3`;
      const result = await axios.get<PrometheusFetchData_POD_CPU_MEMORY>(
        `http://${ip}/prometheus/api/v1/query?query=${query}`
      );

      if (result.data.data.result.length <= 0) {
        return [];
      }

      const transformSchemaForPrometheus = transformPrometheusSchemaToPodMetric(
        result.data.data.result
      );

      return transformSchemaForPrometheus;
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('axiosErr:', error.message);
      return undefined;
    }
  }
  //-----------------------------------------------------------------------------------
  async getNodesCpuRequestedByPods(
    ip: string
  ): Promise<PrometheusTransformResultsToNode[] | undefined> {
    try {
      //get Memory in gb for 2 min
      const query = `sum(kube_pod_container_resource_requests{resource='cpu'}) by (node)`;
      const result = await axios.get<PrometheusFetchData_NODE_CPU_MEMORY>(
        `http://${ip}/api/v1/query?query=${query}`
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

  async getNodesMemoryRequestedByPods(
    ip: string
  ): Promise<PrometheusTransformResultsToNode[] | undefined> {
    try {
      //get Memory in gb for 2 min
      const query = `sum(kube_pod_container_resource_requests{resource='memory'}) by (node) / 1024^2`;
      const result = await axios.get<PrometheusFetchData_NODE_CPU_MEMORY>(
        `http://${ip}/api/v1/query?query=${query}`
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

  async getNodesAllocateCpuForPods(
    ip: string
  ): Promise<PrometheusTransformResultsToNode[] | undefined> {
    try {
      //get Memory in gb for 2 min
      const query = `kube_node_status_allocatable{resource='cpu'}`;
      const result = await axios.get<PrometheusFetchData_NODE_CPU_MEMORY>(
        `http://${ip}/api/v1/query?query=${query}`
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

  async getNodesAllocateMemoryForPods(
    ip: string
  ): Promise<PrometheusTransformResultsToNode[] | undefined> {
    try {
      //get Memory in mb
      const query = `kube_node_status_allocatable{resource='memory'} / 1024^2`;
      const result = await axios.get<PrometheusFetchData_NODE_CPU_MEMORY>(
        `http://${ip}/api/v1/query?query=${query}`
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

  async getNodeMemoryUsage(
    ip: string,
    namespace: string
  ): Promise<PrometheusTransformResultsToNode[] | undefined> {
    try {
      //get Memory in gb for 2 min
      const query = `sum(rate(container_memory_working_set_bytes{id!="/",namespace=~"${namespace}"}[2m])) by (pod) / 1024^2`;
      const result = await axios.get<PrometheusFetchData_NODE_CPU_MEMORY>(
        `http://${ip}/api/v1/query?query=${query}`
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

  // return value cores
  async getPodsRequestedCpuByNs(
    ip: string,
    namespace: string
  ): Promise<PrometheusTransformResultsByNode[] | undefined> {
    try {
      //get cpu
      const query = `sum(kube_pod_container_resource_requests{resource='cpu',namespace='${namespace}'}) by (pod,node)`;
      const result = await axios.get<PrometheusFetchData_POD_CPU_MEMORY>(
        `http://${ip}/api/v1/query?query=${query}`
      );

      if (result.data.data.result.length <= 0) {
        return [];
      }

      const transformSchemaForPrometheus =
        transformPrometheusSchemaToPodMetricByNode(result.data.data.result);

      const returnData = transformSchemaForPrometheus.map((data) => ({
        ...data,
        metric: parseFloat(data.metric.toFixed(2)),
      }));

      return returnData;
    } catch (e: unknown) {
      const error = e as Error;
      logger.error(error);
      return undefined;
    }
  }

  // return value to bytes
  async getPodsRequestedMemoryByNs(
    ip: string,
    namespace: string
  ): Promise<PrometheusTransformResultsByNode[] | undefined> {
    try {
      //get Memory in mb
      const query = `sum(kube_pod_container_resource_requests{resource='memory',namespace='${namespace}'}) by (pod,node) / 1024^2`;
      const result = await axios.get<PrometheusFetchData_POD_CPU_MEMORY>(
        `http://${ip}/api/v1/query?query=${query}`
      );

      if (result.data.data.result.length <= 0) {
        return [];
      }

      const transformSchemaForPrometheus =
        transformPrometheusSchemaToPodMetricByNode(result.data.data.result);

      return transformSchemaForPrometheus;
    } catch (e: unknown) {
      const error = e as Error;
      logger.error(error);
      return undefined;
    }
  }

  async getPodsCpuUsageByNs(
    ip: string,
    namespace: string
  ): Promise<PrometheusTransformResultsByNode[] | undefined> {
    try {
      //get Memory in gb for 2 min
      const query = `avg(container_cpu_usage_seconds_total{namespace='${namespace}'}) by (pod,instance)`;
      const result = await axios.get<PrometheusFetchData_POD_CPU_MEMORY>(
        `http://${ip}/api/v1/query?query=${query}`
      );

      if (result.data.data.result.length <= 0) {
        return [];
      }

      const transformSchemaForPrometheus =
        transformPrometheusSchemaToPodMetricByNode(result.data.data.result);

      const returnData = transformSchemaForPrometheus.map((data) => ({
        ...data,
        metric: parseFloat(data.metric.toFixed(2)),
      }));

      return returnData;
    } catch (e: unknown) {
      const error = e as Error;
      logger.error(error);
      return undefined;
    }
  }

  // return value to bytes
  async getPodsMemoryUsageByNs(
    ip: string,
    namespace: string
  ): Promise<PrometheusTransformResults[] | undefined> {
    try {
      //get Memory in mb
      const query = `avg(container_memory_max_usage_bytes{namespace='${namespace}'}) by (pod,instance) / 1024^2`;
      const result = await axios.get<PrometheusFetchData_POD_CPU_MEMORY>(
        `http://${ip}/api/v1/query?query=${query}`
      );

      if (result.data.data.result.length <= 0) {
        return [];
      }

      const transformSchemaForPrometheus =
        transformPrometheusSchemaToPodMetricByNode(result.data.data.result);

      return transformSchemaForPrometheus;
    } catch (e: unknown) {
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

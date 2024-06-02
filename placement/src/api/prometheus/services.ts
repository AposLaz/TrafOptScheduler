import { PrometheusResults, PrometheusTransformResults } from './types';

export async function transformPrometheusSchemaToPodMetric(
  results: PrometheusResults[]
): Promise<PrometheusTransformResults[]> {
  const returnResults: PrometheusTransformResults[] = [];

  await Promise.all(
    results.map((data) => {
      const returnObject: PrometheusTransformResults = {
        pod: data.metric.pod,
        metric: Number(data.value[1]),
      };
      returnResults.push(returnObject);
    })
  );

  return returnResults;
}

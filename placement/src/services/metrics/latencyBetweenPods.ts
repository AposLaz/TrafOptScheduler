import prometheusApi from '../../api/prometheus/prometheusApi';
import { Config } from '../../config/config';
import { removeDuplicateZeroValues } from './services';
import {
  AppLinksLatency,
  AppLinksReplicasLatency,
  TrafficRatesLatency,
} from './types';

export const totalLatencyBetweenPods = async (
  namespace: string
): Promise<TrafficRatesLatency | undefined> => {
  // Fetch the request and response messages for each app link in the namespace from the Prometheus API
  const latency = await prometheusApi.getLatencyBetweenPods(
    namespace,
    Config.SCHEDULE_TIME
  );

  // If no returned data means that there is no communication in the namespace, return undefined
  if (!latency || latency.length === 0) return;

  // Remove duplicate zero values from the response messages
  const uniqueLatency = removeDuplicateZeroValues(latency);

  // Initialize an array to store the app links and their messages
  const istioRateLatencyAppLinks: AppLinksLatency[] = [];
  let totalLatency = 0;

  // Loop through each unique request message and find the corresponding response message
  for (const lat of uniqueLatency) {
    // Add the app link and its messages to the array
    istioRateLatencyAppLinks.push({
      source: lat.source,
      target: lat.target,
      replicas: {
        pod: lat.replicaPod,
        node: lat.node,
        latency: parseFloat(lat.metric.toFixed(2)),
      },
    });

    // Update the total sum of messages
    totalLatency = totalLatency + parseFloat(lat.metric.toFixed(2));
  }

  // Combine duplicate app links and calculate the total bytes and messages for each app link in the namespace
  const istioRateLatency: AppLinksReplicasLatency[] = [];

  for (const appLink of istioRateLatencyAppLinks) {
    const existingEntry = istioRateLatency.find(
      (item) => item.source === appLink.source && item.target === appLink.target
    );
    if (existingEntry) {
      existingEntry.replicas.push(appLink.replicas);

      const latency = existingEntry.linkTotalLatency + appLink.replicas.latency;

      existingEntry.linkTotalLatency = latency;
    } else {
      istioRateLatency.push({
        source: appLink.source,
        target: appLink.target,
        replicas: [appLink.replicas],
        linkTotalLatency: appLink.replicas.latency,
      });
    }
  }

  // Return the metrics for each app link in the namespace and the total sum of messages
  return {
    namespace: namespace,
    appLinks: istioRateLatency,
    totalLatency: parseFloat(totalLatency.toFixed(2)),
  };
};

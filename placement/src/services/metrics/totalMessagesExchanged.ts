import prometheusApi from '../../api/prometheus/prometheusApi';
import { Config } from '../../config/config';
import { removeDuplicateZeroValues } from './services';
import {
  AppLinksMessages,
  AppLinksReplicasMessages,
  TrafficRatesMessages,
} from './types';

/**
 * This function fetches the total sum of messages exchanged for each app link in a given namespace.
 * It first fetches the request and response messages for each app link from the Prometheus API.
 * It then combines the duplicate app links and calculates the total bytes and messages for each app link.
 *
 * @param {string} prometheusIp - The IP address of the Prometheus server.
 * @param {string} namespace - The name of the namespace for which to fetch the metrics.
 * @returns {Promise<TrafficRatesMessages | undefined>} - A promise that resolves to an object containing the namespace,
 * traffic metrics for each app link, the total sum of messages exchanged. If the operation is unsuccessful, the promise resolves to undefined.
 */
export const totalMessagesExchanged = async (
  namespace: string
): Promise<TrafficRatesMessages | undefined> => {
  // Fetch the request and response messages for each app link in the namespace from the Prometheus API
  const requestMsgs = await prometheusApi.getRequestMessagesByNs(
    namespace,
    Config.SCHEDULE_TIME
  );

  // If no returned data means that there is no communication in the namespace, return undefined
  if (!requestMsgs || requestMsgs.length === 0) return;

  // Remove duplicate zero values from the request messages
  const uniqueRequestMsgs = removeDuplicateZeroValues(requestMsgs);

  const responseMsgs = await prometheusApi.getResponseMessagesByNs(
    namespace,
    Config.SCHEDULE_TIME
  );

  // If no returned data means that there is no communication in the namespace, return undefined
  if (!responseMsgs || responseMsgs.length === 0) return;

  // Remove duplicate zero values from the response messages
  const uniqueResponseMsgs = removeDuplicateZeroValues(responseMsgs);

  const tcpConnections = await prometheusApi.getTcpConnectionsByNs(namespace);

  if (tcpConnections && tcpConnections.length > 0) {
    const uniqueTcpValues = removeDuplicateZeroValues(tcpConnections);
    uniqueRequestMsgs.push(...uniqueTcpValues);
  }
  // Initialize an array to store the app links and their messages
  const istioRateMsgsAppLinks: AppLinksMessages[] = [];
  let totalSumMsgs = 0;

  // Loop through each unique request message and find the corresponding response message
  for (const req of uniqueRequestMsgs) {
    const res = uniqueResponseMsgs.find(
      (res) =>
        res.node === req.node &&
        res.source === req.source &&
        res.target === req.target &&
        res.replicaPod === req.replicaPod
    );

    // Calculate the sum of messages for the app link
    const sumMsgs = res
      ? parseFloat((req.metric + res.metric).toFixed(2))
      : parseFloat(req.metric.toFixed(2));

    // Add the app link and its messages to the array
    istioRateMsgsAppLinks.push({
      source: req.source,
      target: req.target,
      replicas: {
        pod: req.replicaPod,
        node: req.node,
        totalMessages: sumMsgs,
      },
    });

    // Update the total sum of messages
    totalSumMsgs = totalSumMsgs + sumMsgs;
  }

  // Combine duplicate app links and calculate the total bytes and messages for each app link in the namespace
  const istioRateMsgs: AppLinksReplicasMessages[] = [];

  for (const appLink of istioRateMsgsAppLinks) {
    const existingEntry = istioRateMsgs.find(
      (item) => item.source === appLink.source && item.target === appLink.target
    );
    if (existingEntry) {
      existingEntry.replicas.push(appLink.replicas);

      const exchMsgs =
        existingEntry.linkTotalMessagesExchanged +
        appLink.replicas.totalMessages;

      existingEntry.linkTotalMessagesExchanged = exchMsgs;
    } else {
      istioRateMsgs.push({
        source: appLink.source,
        target: appLink.target,
        replicas: [appLink.replicas],
        linkTotalMessagesExchanged: appLink.replicas.totalMessages,
      });
    }
  }

  // Return the metrics for each app link in the namespace and the total sum of messages
  return {
    namespace: namespace,
    appLinks: istioRateMsgs,
    totalMessagesExchanged: totalSumMsgs,
  };
};

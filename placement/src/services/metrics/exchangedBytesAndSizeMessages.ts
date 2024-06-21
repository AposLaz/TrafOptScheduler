import prometheusApi from '../../api/prometheus/prometheusApi';
import { removeDuplicateZeroValues } from './services';
import {
  AppLinksBytes,
  AppLinksReplicasBytes,
  TrafficRatesBytes,
} from './types';

/**
 * This function fetches traffic metrics for a given namespace from the Prometheus API.
 * It calculates the total sum of bytes exchanged and the total size of messages
 * for each app link in the namespace. It also calculates the count of bytes and
 * messages for each app link in the namespace.
 *
 * @param {string} prometheusIp - The IP address of the Prometheus server.
 * @param {string} namespace - The name of the namespace for which to fetch the metrics.
 * @returns {Promise<TrafficRatesBytes | undefined>} - A promise that resolves to an object containing the namespace,
 * traffic metrics for each app link, the total sum of bytes exchanged, and the total size of messages. If the operation
 * is unsuccessful, the promise resolves to undefined.
 */
export const appExchangedBytesAndSizeMessages = async (
  prometheusIp: string,
  namespace: string
): Promise<TrafficRatesBytes | undefined> => {
  // Fetch the sum of request bytes for each app link in the namespace
  const sumRequestBytes = await prometheusApi.getHttpPodsRequestBytesSumByNs(
    prometheusIp,
    namespace
  );

  // No returned data means that there is no communication in the namespace
  if (!sumRequestBytes || sumRequestBytes.length === 0) return;

  // Return all non-null metrics with duplicates
  const uniqueSumRequestBytes = removeDuplicateZeroValues(sumRequestBytes);

  // Fetch the sum of TCP request bytes for each app link in the namespace
  const sumTcpRequestBytes = await prometheusApi.getTcpPodsRequestBytesSumByNs(
    prometheusIp,
    namespace
  );

  // If TCP request bytes data is returned by the API, add it to the uniqueSumRequestBytes array
  if (sumTcpRequestBytes && sumTcpRequestBytes.length > 0) {
    const uniqueTcpValues = removeDuplicateZeroValues(sumTcpRequestBytes);
    uniqueSumRequestBytes.push(...uniqueTcpValues);
  }

  // Fetch the sum of response bytes for each app link in the namespace
  const sumResponseBytes = await prometheusApi.getHttpPodsResponseBytesSumByNs(
    prometheusIp,
    namespace
  );

  // No returned data means that there is no communication in the namespace
  if (!sumResponseBytes || sumRequestBytes.length === 0) return;

  // Return all non-null metrics with duplicates
  const uniqueSumResponseBytes = removeDuplicateZeroValues(sumResponseBytes);

  // Fetch the sum of TCP response bytes for each app link in the namespace
  const sumTcpResponseBytes =
    await prometheusApi.getTcpPodsResponseBytesSumByNs(prometheusIp, namespace);

  // If TCP response bytes data is returned by the API, add it to the uniqueSumResponseBytes array
  if (sumTcpResponseBytes && sumTcpResponseBytes.length > 0) {
    const uniqueTcpValues = removeDuplicateZeroValues(sumTcpResponseBytes);
    uniqueSumResponseBytes.push(...uniqueTcpValues);
  }

  const istioRateBytesAppLinks: AppLinksBytes[] = [];
  let totalSumBytes = 0;

  // Calculate the total sum of bytes exchanged and the total size of messages for each app link in the namespace
  for (const req of uniqueSumRequestBytes) {
    const res = uniqueSumResponseBytes.find(
      (res) =>
        res.node === req.node &&
        res.source === req.source &&
        res.target === req.target &&
        res.replicaPod === req.replicaPod
    );

    const sumBytes = res
      ? parseFloat((req.metric + res.metric).toFixed(2))
      : parseFloat(req.metric.toFixed(2));

    istioRateBytesAppLinks.push({
      source: req.source,
      target: req.target,
      replicas: {
        pod: req.replicaPod,
        node: req.node,
        sumBytes: sumBytes,
        countBytes: 0, // Default value
      },
    });

    totalSumBytes = totalSumBytes + sumBytes;
  }

  // Fetch the count of request bytes for each app link in the namespace
  const countRequestBytes =
    await prometheusApi.getHttpPodsRequestBytesCountByNs(
      prometheusIp,
      namespace
    );

  // No returned data means that there is no communication in the namespace
  if (!countRequestBytes || sumRequestBytes.length === 0) return;

  // Return all non-null metrics with duplicates
  const uniqueCountRequestBytes = removeDuplicateZeroValues(countRequestBytes);

  // Fetch the count of response bytes for each app link in the namespace
  const countResponseBytes =
    await prometheusApi.getHttpPodsResponseBytesCountByNs(
      prometheusIp,
      namespace
    );

  // If no data is returned by the API, return undefined
  if (!countResponseBytes || sumRequestBytes.length === 0) return;

  // Return all non-null metrics with duplicates
  const uniqueCountResponseBytes =
    removeDuplicateZeroValues(countResponseBytes);

  let totalCountBytes = 0;

  // Update istioRateBytesAppLinks with count metrics and calculate the total bytes and messages for each app link in the namespace
  for (const req of uniqueCountRequestBytes) {
    const res = uniqueCountResponseBytes.find(
      (res) =>
        res.node === req.node &&
        res.source === req.source &&
        res.target === req.target &&
        res.replicaPod === req.replicaPod
    );

    for (let i = 0; i < istioRateBytesAppLinks.length; i++) {
      const data = istioRateBytesAppLinks[i];

      if (
        data.source === req.source &&
        data.target === req.target &&
        data.replicas.pod === req.replicaPod
      ) {
        const countBytes = res
          ? parseFloat((req.metric + res.metric).toFixed(2))
          : parseFloat(req.metric.toFixed(3));

        istioRateBytesAppLinks[i] = {
          ...data,
          replicas: {
            ...data.replicas,
            countBytes: countBytes,
          },
        };

        totalCountBytes = totalCountBytes + countBytes;

        break;
      }
    }
  }

  const istioRateBytes: AppLinksReplicasBytes[] = [];

  // Combine duplicate app links and calculate the total bytes and messages for each app link in the namespace
  for (const appLink of istioRateBytesAppLinks) {
    const existingEntry = istioRateBytes.find(
      (item) => item.source === appLink.source && item.target === appLink.target
    );
    if (existingEntry) {
      existingEntry.replicas.push(appLink.replicas);

      const exchBytes =
        existingEntry.linkBytesExchanged + appLink.replicas.sumBytes;

      existingEntry.linkBytesExchanged = parseFloat(exchBytes.toFixed(3));

      const msgSize =
        existingEntry.linkMessagesSize + appLink.replicas.countBytes;

      existingEntry.linkMessagesSize = parseFloat(msgSize.toFixed(3));
    } else {
      istioRateBytes.push({
        source: appLink.source,
        target: appLink.target,
        replicas: [appLink.replicas],
        linkBytesExchanged: parseFloat(appLink.replicas.sumBytes.toFixed(3)),
        linkMessagesSize: parseFloat(appLink.replicas.countBytes.toFixed(3)),
      });
    }
  }

  return {
    namespace: namespace,
    appLinks: istioRateBytes,
    totalBytesExchanged: parseFloat(totalSumBytes.toFixed(2)),
    totalMessagesSize: parseFloat(totalCountBytes.toFixed(2)),
  };
};

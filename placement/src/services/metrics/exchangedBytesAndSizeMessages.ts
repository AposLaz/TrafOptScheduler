import prometheusApi from '../../api/prometheus/prometheusApi';
import { removeDuplicateZeroValues } from './services';
import { AppLinks, AppLinksReplicas, TrafficRatesBytes } from './types';

export const appExchangedBytesAndSizeMessages = async (
  prometheusIp: string,
  namespace: string
): Promise<TrafficRatesBytes | undefined> => {
  const sumRequestBytes = await prometheusApi.getPodsRequestBytesSumByNs(
    prometheusIp,
    namespace
  );

  if (!sumRequestBytes) return;

  // return all not null metrics with duplicates
  const uniqueSumRequestBytes = removeDuplicateZeroValues(sumRequestBytes);

  console.info(uniqueSumRequestBytes);

  const sumResponseBytes = await prometheusApi.getPodsResponseBytesSumByNs(
    prometheusIp,
    namespace
  );

  if (!sumResponseBytes) return;

  // return all not null metrics with duplicates
  const uniqueSumResponseBytes = removeDuplicateZeroValues(sumResponseBytes);

  console.info(uniqueSumResponseBytes);

  const istioRateBytesAppLinks: AppLinks[] = [];

  // calculate total sum bytes for app in namespace
  let totalSumBytes = 0;

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
        countBytes: 0, // we give a default value
      },
    });

    totalSumBytes = totalSumBytes + sumBytes;
  }

  const countRequestBytes = await prometheusApi.getPodsRequestBytesCountByNs(
    prometheusIp,
    namespace
  );

  if (!countRequestBytes) return;

  // return all not null metrics with duplicates
  const uniqueCountRequestBytes = removeDuplicateZeroValues(countRequestBytes);

  console.info(uniqueCountRequestBytes);

  //TODO calculate total app sum of bytes

  const countResponseBytes = await prometheusApi.getPodsResponseBytesCountByNs(
    prometheusIp,
    namespace
  );

  if (!countResponseBytes) return;

  // return all not null metrics with duplicates
  const uniqueCountResponseBytes =
    removeDuplicateZeroValues(countResponseBytes);

  console.info(uniqueCountResponseBytes);

  // calculate total bytes of app in namespace
  let totalCountBytes = 0;

  // Update istioRateBytesAppLinks with count metrics
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

  const istioRateBytes: AppLinksReplicas[] = [];

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

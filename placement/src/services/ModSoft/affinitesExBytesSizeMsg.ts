import { logger } from '../../config/logger';
import { appExchangedBytesAndSizeMessages } from '../metrics/exchangedBytesAndSizeMessages';
import { TrafficExcSizeBytesAffinities } from './types';

export const calculateAffinitiesForExBytesAndSizeMsgs = async (
  promIp: string,
  namespace: string
) => {
  const getTrafficGraph = await appExchangedBytesAndSizeMessages(
    promIp,
    namespace
  );

  if (!getTrafficGraph) {
    logger.error('No data returned from exchanged bytes and size messages');
    return;
  }

  const affinities: TrafficExcSizeBytesAffinities = {
    namespace: namespace,
    totalExchBytes: getTrafficGraph.totalBytesExchanged,
    totalMsgSize: getTrafficGraph.totalMessagesSize,
    appLinks: [],
  };

  getTrafficGraph.appLinks.forEach((data) => {
    const affExchBytes = data.linkBytesExchanged / affinities.totalExchBytes;
    const affMsgSize = data.linkMessagesSize / affinities.totalMsgSize;

    const affinity = affExchBytes * 0.5 + affMsgSize * 0.5;

    affinities.appLinks.push({
      ...data,
      affinity: parseFloat(affinity.toFixed(3)),
    });
  });

  return affinities;
};

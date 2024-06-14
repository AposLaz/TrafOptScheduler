import { logger } from '../../config/logger';
import { appExchangedBytesAndSizeMessages } from '../metrics/exchangedBytesAndSizeMessages';
import {
  AppLinksGraphAffinities,
  AppLinksGraphAvgPropAndAffinities,
  SourceTargetsAppLinks,
  TrafficExcSizeBytesAffinities,
} from './types';

export const calculateAffinitiesForExBytesAndSizeMsgs = async (
  promIp: string,
  namespace: string
): Promise<AppLinksGraphAffinities | undefined> => {
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
      affinity: parseFloat(affinity.toFixed(2)),
    });
  });

  const totalAffinities = degreeAndTotalAffinities(affinities);
  return totalAffinities;
};

const degreeAndTotalAffinities = (
  dataSet: TrafficExcSizeBytesAffinities
): AppLinksGraphAffinities => {
  const transformed: { [key: string]: SourceTargetsAppLinks } = {};

  let totalWeightAffinity = 0; //is the sum of affinities of all target links for each source.

  dataSet.appLinks.forEach((link) => {
    if (!transformed[link.source]) {
      transformed[link.source] = {
        source: link.source,
        degreeSourceTargetsAffinity: 0, // // is the sum of affinities for all targets linked from a given source.
        targets: [],
      };
    }

    transformed[link.source].targets.push({
      target: link.target,
      replicas: link.replicas,
      linkBytesExchanged: link.linkBytesExchanged,
      linkMessagesSize: link.linkMessagesSize,
      affinity: link.affinity,
    });

    transformed[link.source].degreeSourceTargetsAffinity =
      transformed[link.source].degreeSourceTargetsAffinity + link.affinity;

    totalWeightAffinity = totalWeightAffinity + link.affinity;
  });

  return {
    ...dataSet,
    totalWeightAffinity: parseFloat(totalWeightAffinity.toFixed(2)),
    appLinks: Object.values(transformed),
  };
};

export const avgProbability = (
  graph: AppLinksGraphAffinities
): AppLinksGraphAvgPropAndAffinities => {
  const transormedData = graph.appLinks.map((link) => ({
    ...link,
    avgProbability: parseFloat(
      (link.degreeSourceTargetsAffinity / graph.totalWeightAffinity).toFixed(3)
    ),
  }));

  return {
    ...graph,
    appLinks: transormedData,
  };
};

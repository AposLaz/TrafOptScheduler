import { logger } from '../../config/logger';
import { appExchangedBytesAndSizeMessages } from '../metrics/exchangedBytesAndSizeMessages';
import {
  AppLinksGraphAffinities,
  AppLinksGraphAvgPropAndAffinities,
  SourceTargetsAppLinks,
  TrafficExcSizeBytesAffinities,
} from './types';

/**
 * This function calculates affinities for each app link in a given namespace using
 * data from Prometheus. It takes the Prometheus IP and namespace as parameters and
 * returns an object of type AppLinksGraphAffinities.
 *
 * @param {string} promIp - The IP address of the Prometheus server.
 * @param {string} namespace - The Kubernetes namespace for which to calculate affinities.
 * @returns {Promise<AppLinksGraphAffinities | undefined>} - An object containing the
 * namespace and affinities for each app link, or undefined if no data is returned
 * from Prometheus.
 */
export const calculateAffinitiesForExBytesAndSizeMsgs = async (
  promIp: string,
  namespace: string
): Promise<AppLinksGraphAffinities | undefined> => {
  // Fetch traffic data for the given namespace from Prometheus
  const getTrafficGraph = await appExchangedBytesAndSizeMessages(
    promIp,
    namespace
  );

  // If no data is returned, log an error and return undefined
  if (!getTrafficGraph) {
    logger.error('No data returned from exchanged bytes and size messages');
    return;
  }

  // Initialize an object to store the affinities for each app link in the namespace
  const affinities: TrafficExcSizeBytesAffinities = {
    namespace: namespace,
    totalExchBytes: getTrafficGraph.totalBytesExchanged,
    totalMsgSize: getTrafficGraph.totalMessagesSize,
    appLinks: [],
  };

  // Calculate affinities for each app link in the namespace
  getTrafficGraph.appLinks.forEach((data) => {
    // Calculate the affinity for the app link based on the proportion of total bytes
    // and messages exchanged
    const affExchBytes = data.linkBytesExchanged / affinities.totalExchBytes;
    const affMsgSize = data.linkMessagesSize / affinities.totalMsgSize;
    const affinity = affExchBytes * 0.5 + affMsgSize * 0.5;

    // Add the affinity to the app link object and round it to two decimal places
    affinities.appLinks.push({
      ...data,
      affinity: parseFloat(affinity.toFixed(2)),
    });
  });

  // Calculate the total affinity for each source link in the namespace
  const totalAffinities = degreeAndTotalAffinities(affinities);

  // Return the object containing the namespace and affinities for each app link
  return totalAffinities;
};

/**
 * This function takes a dataset of traffic exchange bytes and size messages between
 * different services in a given namespace. It transforms the data into a format that is
 * more suitable for further processing and calculates the sum of affinities for all target
 * links for each source. It returns an object of type AppLinksGraphAffinities.
 *
 * @param {TrafficExcSizeBytesAffinities} dataSet - The dataset of traffic exchange bytes
 * and size messages between different services in a given namespace.
 * @return {AppLinksGraphAffinities} - An object of type AppLinksGraphAffinities that
 * contains the transformed data and the sum of affinities for all target links for each
 * source.
 */
const degreeAndTotalAffinities = (
  dataSet: TrafficExcSizeBytesAffinities
): AppLinksGraphAffinities => {
  // Initialize an empty object to store the transformed data.
  const transformed: { [key: string]: SourceTargetsAppLinks } = {};

  let totalWeightAffinity = 0; // Initialize the sum of affinities for all target links for each source.

  // Iterate through each link in the dataset.
  dataSet.appLinks.forEach((link) => {
    // If the source of the link is not present in the transformed object, add it.
    if (!transformed[link.source]) {
      transformed[link.source] = {
        source: link.source, // Set the source of the link.
        communitiesProb: [{ [link.source]: 1 }], // Set the community probability for the source, regarding on Louvain.
        degreeSourceTargetsAffinity: 0, // Initialize the sum of affinities for all targets linked from the source.
        targets: [], // Initialize an empty array to store the targets of the source.
      };
    }

    // Push the link to the targets array of the source.
    transformed[link.source].targets.push({
      target: link.target, // Set the target of the link.
      replicas: link.replicas, // Set the replicas of the link.
      linkBytesExchanged: link.linkBytesExchanged, // Set the link bytes exchanged.
      linkMessagesSize: link.linkMessagesSize, // Set the link messages size.
      affinity: link.affinity, // Set the affinity of the link.
    });

    // Increment the sum of affinities for all targets linked from the source.
    transformed[link.source].degreeSourceTargetsAffinity =
      transformed[link.source].degreeSourceTargetsAffinity + link.affinity;

    // Increment the sum of affinities for all target links for each source.
    totalWeightAffinity = totalWeightAffinity + link.affinity;
  });

  // Return an object of type AppLinksGraphAffinities that contains the transformed data and the sum of affinities for all target links for each source.
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

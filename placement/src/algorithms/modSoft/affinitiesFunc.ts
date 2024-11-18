import { logger } from '../../config/logger';
import { appExchangedBytesAndSizeMessages } from '../../services/metrics/exchangedBytesAndSizeMessages';
import { totalLatencyBetweenPods } from '../../services/metrics/latencyBetweenPods';
import { totalMessagesExchanged } from '../../services/metrics/totalMessagesExchanged';
import {
  AppLinksGraphAffinities,
  AppLinksGraphAvgPropAndAffinities,
  AppLinksReplicasAffinities,
  SourceTargetsAppLinks,
  TrafficRateAffinities,
} from './types';

/**
 * This function calculates affinities for each app link in a given namespace using
 * data from Prometheus. It takes the namespace as parameters and
 * returns an object of type AppLinksGraphAffinities.
 *
 * @param {string} namespace - The Kubernetes namespace for which to calculate affinities.
 * @returns {Promise<AppLinksGraphAffinities | undefined>} - An object containing the
 * namespace and affinities for each app link, or undefined if no data is returned
 * from Prometheus.
 */
export const calculateAffinities = async (
  namespace: string
): Promise<AppLinksGraphAffinities | undefined> => {
  // Fetch traffic data for the given namespace from Prometheus
  const graphBytes = await appExchangedBytesAndSizeMessages(namespace);

  // If no data is returned, log an error and return undefined means that no communication exists
  if (!graphBytes) {
    // Log an error message indicating that no data was returned from Prometheus
    logger.error('No data returned from exchanged bytes and size messages');
    return;
  }

  const graphMessages = await totalMessagesExchanged(namespace);

  // If no data is returned, log an error and return undefined means that no communication exists
  if (!graphMessages) {
    // Log an error message indicating that no data was returned from Prometheus
    logger.error('No data returned from exchanged messages');
    return;
  }

  const graphLatency = await totalLatencyBetweenPods(namespace);

  // If no data is returned, log an error and return undefined means that no communication exists
  if (!graphLatency) {
    // Log an error message indicating that no data was returned from Prometheus
    logger.error('No data returned from exchanged messages');
    return;
  }

  // Initialize an array to store the combined app links from the two graphs
  const combinedGraphLinksBytesMsgs: AppLinksReplicasAffinities[] = [];

  // Combine graph bytes with total messages
  graphBytes.appLinks.forEach((appLinkBytes) => {
    // Find the corresponding app link in the graphMessages object
    const existingLink = graphMessages.appLinks.find(
      (item) =>
        item.source === appLinkBytes.source &&
        item.target === appLinkBytes.target
    );

    // If the app link exists in both graphs, combine the replicas and calculate affinities
    if (existingLink) {
      // Create a new array of replicas with combined data from the two graphs
      const newTargetsType = appLinkBytes.replicas.map((replica) => {
        // Find the corresponding replica in the existing app link
        const existingReplica = existingLink.replicas.find(
          (item) => item.pod === replica.pod && item.node === replica.node
        );

        // If the replica exists, add the data from both graphs
        if (existingReplica) {
          return {
            pod: replica.pod,
            node: replica.node,
            sumBytes: replica.sumBytes,
            countBytes: replica.countBytes,
            totalMessages: existingReplica.totalMessages,
            latency: 0,
          };
        } else {
          // If the replica does not exist, add the data from the app link and set totalMessages to 0
          return {
            pod: replica.pod,
            node: replica.node,
            sumBytes: replica.sumBytes,
            countBytes: replica.countBytes,
            totalMessages: 0,
            latency: 0,
          };
        }
      });

      // Add the combined data to the combinedGraphLinks array
      combinedGraphLinksBytesMsgs.push({
        source: appLinkBytes.source,
        target: appLinkBytes.target,
        replicas: newTargetsType,
        linkTotalMessages: existingLink.linkTotalMessagesExchanged,
        linkBytesExchanged: appLinkBytes.linkBytesExchanged,
        linkMessagesSize: appLinkBytes.linkMessagesSize,
        linkTotalLatency: 0,
        affinity: 0,
      });
    } else {
      // If the app link does not exist in the graphMessages object, add the data from the app link and set totalMessages to 0
      combinedGraphLinksBytesMsgs.push({
        source: appLinkBytes.source,
        target: appLinkBytes.target,
        replicas: appLinkBytes.replicas.map((replica) => ({
          ...replica,
          totalMessages: 0,
          latency: 0,
        })),
        linkTotalMessages: 0,
        linkBytesExchanged: appLinkBytes.linkBytesExchanged,
        linkMessagesSize: appLinkBytes.linkMessagesSize,
        linkTotalLatency: 0,
        affinity: 0,
      });
    }
  });

  // Initialize an array to store the combined app links from the two graphs
  const combinedGraphLinks: AppLinksReplicasAffinities[] = [];

  // Combine graph bytes with total messages
  combinedGraphLinksBytesMsgs.forEach((appLink) => {
    // Find the corresponding app link in the graphMessages object
    const existingLink = graphLatency.appLinks.find(
      (item) => item.source === appLink.source && item.target === appLink.target
    );

    // If the app link exists in both graphs, combine the replicas and calculate affinities
    if (existingLink) {
      // Create a new array of replicas with combined data from the two graphs
      const newTargetsType = appLink.replicas.map((replica) => {
        // Find the corresponding replica in the existing app link
        const existingReplica = existingLink.replicas.find(
          (item) => item.pod === replica.pod && item.node === replica.node
        );

        // If the replica exists, add the data from both graphs
        if (existingReplica) {
          return {
            ...replica,
            latency: existingReplica.latency,
          };
        } else {
          // If the replica does not exist, add the data from the app link and set totalMessages to 0
          return {
            ...replica,
          };
        }
      });

      // Add the combined data to the combinedGraphLinks array
      combinedGraphLinks.push({
        source: appLink.source,
        target: appLink.target,
        replicas: newTargetsType,
        linkTotalMessages: appLink.linkTotalMessages,
        linkBytesExchanged: appLink.linkBytesExchanged,
        linkMessagesSize: appLink.linkMessagesSize,
        linkTotalLatency: existingLink.linkTotalLatency,
        affinity: 0,
      });
    } else {
      // If the app link does not exist in the graphMessages object, add the data from the app link and set totalMessages to 0
      combinedGraphLinks.push({
        source: appLink.source,
        target: appLink.target,
        replicas: appLink.replicas.map((replica) => ({
          ...replica,
          latency: 0,
        })),
        linkTotalMessages: appLink.linkTotalMessages,
        linkBytesExchanged: appLink.linkBytesExchanged,
        linkMessagesSize: appLink.linkMessagesSize,
        linkTotalLatency: 0,
        affinity: 0,
      });
    }
  });

  // Initialize an object to store the affinities for each app link in the namespace
  const affinities: TrafficRateAffinities = {
    namespace: namespace,
    totalExchBytes: graphBytes.totalBytesExchanged,
    totalMsgSize: graphBytes.totalMessagesSize,
    totalMsgs: graphMessages.totalMessagesExchanged,
    totalLatency: graphLatency.totalLatency,
    appLinks: [],
  };

  // Loop through each combined app link in the combinedGraphLinks array
  combinedGraphLinks.forEach((data) => {
    // Calculate the affinity for the app link based on the proportion of total bytes
    // and messages exchanged
    const affExchBytes = data.linkBytesExchanged / affinities.totalExchBytes;
    const affMsgSize = data.linkMessagesSize / affinities.totalMsgSize;
    const affTotalMsg = data.linkTotalMessages / affinities.totalMsgs;
    const affLatency = data.linkTotalLatency / affinities.totalLatency;

    // More affinity is given to total messages that were sent than to the bytes
    const affinity =
      affExchBytes * 0.2 +
      affMsgSize * 0.1 +
      affTotalMsg * 0.4 +
      affLatency * 0.3;

    // Add the affinity to the app link object and round it to two decimal places
    affinities.appLinks.push({
      ...data,
      affinity: parseFloat(affinity.toFixed(5)),
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
 * @param {TrafficRateAffinities} dataSet - The dataset of traffic exchange bytes
 * and size messages between different services in a given namespace.
 * @return {AppLinksGraphAffinities} - An object of type AppLinksGraphAffinities that
 * contains the transformed data and the sum of affinities for all target links for each
 * source.
 */
const degreeAndTotalAffinities = (
  dataSet: TrafficRateAffinities
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
      linkTotalMessages: link.linkTotalMessages, // Set the link total messages.
      linkTotalLatency: link.linkTotalLatency,
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
    totalWeightAffinity: parseFloat(totalWeightAffinity.toFixed(5)),
    appLinks: Object.values(transformed),
  };
};

/**
 * This function calculates the average probability for each source in the graph.
 * The average probability is calculated by dividing the sum of affinities for all targets linked from a source,
 * by the total sum of affinities for all target links for each source.
 * The function takes an object of type AppLinksGraphAffinities as input and returns an object of type AppLinksGraphAvgPropAndAffinities.
 * @param graph - An object of type AppLinksGraphAffinities that contains the transformed data and the sum of affinities for all target links for each source.
 * @returns An object of type AppLinksGraphAvgPropAndAffinities that contains the transformed data, the sum of affinities for all target links for each source,
 * and the average probability for each source.
 */
export const avgProbability = (
  graph: AppLinksGraphAffinities
): AppLinksGraphAvgPropAndAffinities => {
  // Create a new array by mapping over each link in the appLinks array of the graph object.
  // For each link, create a new object with the same properties as the link,
  // and add an additional property 'avgProbability' that is the average probability for the link.
  // The average probability is calculated by dividing the degreeSourceTargetsAffinity property of the link by the totalWeightAffinity property of the graph object.
  const transformedData = graph.appLinks.map((link) => ({
    ...link, // Copy the properties of the link object.
    avgProbability: parseFloat(
      // Calculate the average probability by dividing the degreeSourceTargetsAffinity property of the link by the totalWeightAffinity property of the graph object.
      // Parse the result to a float with 5 decimal places and return it.
      (link.degreeSourceTargetsAffinity / graph.totalWeightAffinity).toFixed(5)
    ),
  }));

  // Return a new object that is a copy of the graph object,
  // with the appLinks property replaced by the transformedData array.
  return {
    ...graph, // Copy the properties of the graph object.
    appLinks: transformedData, // Replace the appLinks property with the transformedData array.
  };
};

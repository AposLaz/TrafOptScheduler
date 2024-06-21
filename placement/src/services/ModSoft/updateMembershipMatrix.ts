import { AppLinksGraphAvgPropAndAffinities } from './types';

/**
 * This function creates a partition object based on the given graph data.
 *
 * The function takes in an object of type AppLinksGraphAvgPropAndAffinities,
 * which contains the graph data including the links, their properties,
 * and the communities probabilities.
 *
 * The function iterates over each link in the graph data. For each link,
 * it checks if a partition object for the source node already exists.
 * If it doesn't, it creates a new partition object for the source node,
 * and sets its initial community probabilities to the first community
 * probabilities of the link.
 *
 * After iterating over all the links, the function returns the partition object.
 * The partition object is a dictionary with keys representing the source nodes
 * of the links, and values representing another dictionary with keys representing
 * the communities, and values representing the probabilities of each community.
 *
 * @param {AppLinksGraphAvgPropAndAffinities} graphData - The graph data object.
 * @return {Object} The partition object.
 */
const createPartitions = (graphData: AppLinksGraphAvgPropAndAffinities) => {
  // Initialize an empty partition object
  const partitions: { [key: string]: { [key: string]: number } } = {};

  // Iterate over each link in the graph data
  graphData.appLinks.forEach((link) => {
    // Check if a partition object for the source node already exists
    if (!partitions[link.source]) {
      // If it doesn't exist, create a new partition object for the source node
      partitions[link.source] = link.communitiesProb[0];
    }
  });

  // Return the partition object
  return partitions;
};

/**
 * The projectionStep function is used to adjust the community membership
 * probabilities in such a way that they sum to 1, ensuring they form a valid probability distribution.
 *
 * The function takes an input dictionary with keys representing communities and values representing
 * the probabilities of each community. The function sorts the probabilities in descending order,
 * calculates the cumulative sum of the probabilities, and iteratively calculates a lambda value that
 * determines how much each community's probability should be decreased. The lambda value is calculated
 * by finding the smallest value that satisfies the condition that the difference between the current
 * probability and the updated probability is less than or equal to the lambda value. The lambda value
 * is then used to update the probabilities of each community.
 *
 * The function returns a new dictionary with the updated probabilities.
 *
 * @param {Object.<string, number>} inDict - The input dictionary with keys representing communities
 *   and values representing the probabilities of each community.
 * @returns {Object.<string, number>} The output dictionary with the updated probabilities.
 */
const projectionStep = (inDict: {
  [key: string]: number;
}): { [key: string]: number } => {
  // Sort the probabilities in descending order
  const values = Object.values(inDict).sort((a, b) => b - a);
  let cumSum = 0; // Initialize the cumulative sum of probabilities
  let lamb = 0; // Initialize the lambda value

  // Iterate through the probabilities in descending order
  for (let i = 0; i < values.length; i++) {
    cumSum += values[i]; // Update the cumulative sum of probabilities

    // Calculate the lambda value that determines how much each community's probability should be decreased
    const newLamb = (1 / (i + 1)) * (cumSum - 1);

    // If the difference between the current probability and the updated probability is less than or equal to the lambda value,
    // break the loop and use the current lambda value to update the probabilities
    if (values[i] - newLamb <= 0) {
      lamb = newLamb;
      break;
    }
  }

  // Create a new dictionary to store the updated probabilities
  const outDict: { [key: string]: number } = {};
  let totalSum = 0;

  // Iterate through the input dictionary and update the probabilities using the lambda value
  for (const key in inDict) {
    outDict[key] = Math.max(inDict[key] - lamb, 0);
    totalSum += outDict[key];
  }

  for (const key in outDict) {
    outDict[key] = parseFloat((outDict[key] / totalSum).toFixed(4));
  }

  return outDict;
};

/**
 * This function updates the membership matrix for each node in the graph data.
 *
 * @param {AppLinksGraphAvgPropAndAffinities} graphData - The graph data containing the links between nodes and their properties.
 * @returns {void}
 */
export const updateMembershipMatrix = (
  graphData: AppLinksGraphAvgPropAndAffinities
) => {
  // Set the resolution and learning rate
  const resolution = 1;
  const lr = 0.05; // learning rate

  // Iterate through each link in the graph data
  graphData.appLinks.forEach((link) => {
    const newP: { [key: string]: number } = {}; // Create a new dictionary to store the updated communities probabilities

    // Get the current communities probabilities for the link
    const currentCommunitiesProb = link.communitiesProb[0];

    // Copy the current communities probabilities to the new dictionary
    for (const com in currentCommunitiesProb) {
      newP[com] = currentCommunitiesProb[com];
    }

    // Initialize the probabilities for each community that the link is connected to
    link.targets.forEach((targetLink) => {
      if (!(targetLink.target in newP)) {
        newP[targetLink.target] = targetLink.affinity;
      }
    });

    /**
     * This section ensures that the probability of the current node belonging to a particular
     * community is influenced by the probabilities of its neighbors belonging to that community, weighted by the edge affinity.
     */
    link.targets.forEach((targetLink) => {
      const weight = targetLink.affinity;
      const neighbor = graphData.appLinks.find(
        (l) => l.source === targetLink.target
      );

      // If the neighbor exists, update the probabilities for each community
      if (neighbor) {
        const neighborCommunitiesProb = neighbor.communitiesProb[0];
        for (const com in neighborCommunitiesProb) {
          // If the community does not exist in the new dictionary, create it with a value of 0
          if (!(com in newP)) {
            newP[com] = 0;
          }
          // Update the probability for the community using the resolution, weight, and neighbor's probability
          newP[com] += resolution * weight * neighborCommunitiesProb[com];
        }
      }
    });

    /**
     * This section represents a regularization term in the gradient descent update. It serves two primary purposes:
     *   - Prevent Overfitting: By subtracting a term proportional to the node's degree and average probability,
     *     the algorithm ensures that the community probabilities don't get too high solely because a node has many connections.
     *     This helps in balancing the influence of nodes with different degrees.
     *   - Encourage Sparsity: The regularization term encourages the community probabilities to be small unless there is strong evidence
     *     (from neighboring nodes) to support a higher probability. This aligns with the goal of sparse soft clustering, where most community
     *     probabilities should ideally be zero or close to zero, leading to a more interpretable and efficient solution.
     */
    for (const com in newP) {
      // Subtract the learning rate, node degree, and average probability from the probability of the community
      newP[com] -= lr * link.degreeSourceTargetsAffinity * link.avgProbability;
    }

    // Apply the projection step to the updated probabilities
    const projectedP = projectionStep(newP);

    // Update the average membership vector for the link
    for (const com in currentCommunitiesProb) {
      // Subtract the probability of the community from the average probability, weighted by the degree and weight affinity
      link.avgProbability -=
        (1 / graphData.totalWeightAffinity) *
        link.degreeSourceTargetsAffinity *
        currentCommunitiesProb[com];

      link.avgProbability = parseFloat(link.avgProbability.toFixed(3));
    }
    // Reset the communities probabilities for the link
    link.communitiesProb[0] = {};

    // Update the communities probabilities for the link using the projected probabilities
    for (const com in projectedP) {
      // Add the probability of the community to the average probability, weighted by the degree and weight affinity
      link.avgProbability +=
        (1 / graphData.totalWeightAffinity) *
        link.degreeSourceTargetsAffinity *
        projectedP[com];

      link.avgProbability = parseFloat(link.avgProbability.toFixed(3));
      // Update the communities probabilities for the link
      link.communitiesProb[0][com] = projectedP[com];
    }

    // Ensure the source node has higher probability in its own community
    const source = link.source;
    if (link.communitiesProb[0][source] <= 0.01) {
      link.communitiesProb[0][source] = 0.1;
    }
  });

  // finally create the partitions of the current graph
  const partitions = createPartitions(graphData);
  return partitions;
};

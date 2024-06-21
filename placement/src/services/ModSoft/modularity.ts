import { AppLinksGraphAvgPropAndAffinities } from './types';

/**
 * This function calculates the modularity of a graph using the algorithm
 * described by Newman (2006). The modularity is a measure of how well a
 * graph's communities capture the underlying structure of the data.
 *
 * @param {AppLinksGraphAvgPropAndAffinities} graphData - An object containing
 *   the graph data, including the links between nodes and their properties.
 * @param {number} [resolution=1] - The resolution parameter for the modularity
 *   calculation. It represents the number of edges to consider in the calculation.
 * @return {number} The modularity of the graph.
 */
export const modularity = (
  graphData: AppLinksGraphAvgPropAndAffinities,
  resolution: number = 1
) => {
  let Q = 0; // Initialize the modularity value

  // Calculate expected density
  // Expected density is a measure of how evenly the links are distributed
  // among the communities
  graphData.appLinks.forEach((link) => {
    const avgP = link.avgProbability; // Get the average probability of a link
    Q -= avgP * avgP; // Subtract the square of the average probability from Q
  });

  // Calculate actual density
  // Actual density measures the actual distribution of links among the communities
  graphData.appLinks.forEach((link) => {
    const node = link.source; // Get the source node of the link
    const nodeCommunitiesProb = link.communitiesProb[0]; // Get the communities probabilities for the source node

    link.targets.forEach((targetLink) => {
      const neighbor = targetLink.target; // Get the target node of the link
      let weight = targetLink.affinity; // Get the weight of the link

      // Handle self-loops
      // Self-loops have a special treatment in the modularity calculation
      if (neighbor === node) {
        weight *= 2; // Double the weight of the link
      }

      const neighborLink = graphData.appLinks.find(
        (l) => l.source === neighbor
      ); // Find the link object for the target node
      if (neighborLink) {
        const neighborCommunitiesProb = neighborLink.communitiesProb[0]; // Get the communities probabilities for the target node

        // Iterate over the communities probabilities for the source node
        for (const com in nodeCommunitiesProb) {
          if (com in neighborCommunitiesProb) {
            Q +=
              resolution *
              (1.0 / graphData.totalWeightAffinity) *
              weight *
              nodeCommunitiesProb[com] *
              neighborCommunitiesProb[com]; // Calculate the contribution to the modularity and add it to Q
          }
        }
      }
    });
  });

  return Q; // Return the calculated modularity
};

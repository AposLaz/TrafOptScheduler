import { AppLinksGraphAvgPropAndAffinities, PartitionsType } from './types';

/**
 * This function filters the partitions based on certain conditions.
 *
 * The function takes in two parameters:
 * - graphData: The graph data object containing the links and their communities probabilities.
 * - partitions: The partition object to be filtered.
 *
 * The function first sorts the partitions based on the number of keys in each partition.
 * Then, it converts the sorted partitions into an object and initializes an empty filteredPartitions object.
 *
 * The function iterates over each key-value pair in the sorted partitions.
 * If the key exists in the value, it checks if the filteredPartitions object already has a key-value pair for that key.
 * If it does, it adds the key-value pair to the existing object.
 * If it doesn't, it creates a new object with the key-value pair.
 *
 * Next, it deletes the key-value pair from the value object.
 *
 * The function then extracts the values greater than or equal to 0.1 from the value object.
 * These values are added to the filteredPartitions object.
 *
 * After that, it extracts the values less than 0.1 from the value object.
 * For each value, the function checks if it is greater than 0.
 * If it is, it adds the key-value pair to the filteredPartitions object.
 * If it isn't, it checks if the key exists in multiple communities.
 * If it does, it adds the key-value pair to the first target that communicates with it.
 * If it doesn't, it adds the key-value pair to the filteredPartitions object.
 *
 * Finally, it returns the filteredPartitions object.
 *
 * @param {AppLinksGraphAvgPropAndAffinities} graphData - The graph data object.
 * @param {PartitionsType} partitions - The partition object to be filtered.
 * @returns {PartitionsType}
 */
export const filterPartitions = (
  graphData: AppLinksGraphAvgPropAndAffinities,
  partitions: PartitionsType
): PartitionsType => {
  // Sort the partitions based on the number of keys in each partition
  const sortedPartitions = Object.entries(partitions).sort(
    (a, b) => Object.keys(b[1]).length - Object.keys(a[1]).length
  );

  // Convert the sorted partitions into an object
  const objPartitions = Object.fromEntries(sortedPartitions);

  // Initialize an empty filteredPartitions object
  const filteredPartitions: PartitionsType = {};

  // Iterate over each key-value pair in the sorted partitions
  for (const [key, value] of Object.entries(objPartitions)) {
    // Check if the key exists in the value
    if (key in value) {
      // If it does, check if the filteredPartitions object already has a key-value pair for that key
      if (filteredPartitions[key]) {
        filteredPartitions[key] = {
          ...filteredPartitions[key],
          [key]: value[key],
        };
      } else {
        filteredPartitions[key] = { [key]: value[key] };
      }
    }

    // Delete the key-value pair from the value object
    delete value[key];

    // Extract the values greater than or equal to 0.1 from the value object
    const partitionsWithBigValues = Object.entries(value).filter(
      (val) => val[1] >= 0.1
    );

    // Add these values to the filteredPartitions object
    if (partitionsWithBigValues.length > 0) {
      const objValues = Object.fromEntries(partitionsWithBigValues);
      filteredPartitions[key] = { ...filteredPartitions[key], ...objValues };
    }

    // Extract the values less than 0.1 from the value object
    const partitionsWithZeroOrSmallValues = Object.entries(value).filter(
      (val) => val[1] < 0.1
    );

    // Iterate over each value
    partitionsWithZeroOrSmallValues.forEach(([keyNoHigh, val]) => {
      // Check if the value is greater than 0
      if (val > 0) {
        // Add the key-value pair to the filteredPartitions object
        filteredPartitions[key] = {
          ...filteredPartitions[key],
          [keyNoHigh]: val,
        };
      } else {
        // Check if the key exists in multiple communities
        let keyExistsInManyCommunities = false;
        for (const [keyP, valueP] of Object.entries(objPartitions)) {
          if (key !== keyP && keyNoHigh in valueP) {
            keyExistsInManyCommunities = true;
            break;
          }
        }

        // If the key exists in multiple communities, add it to the first target that communicates with it
        if (keyExistsInManyCommunities) {
          graphData.appLinks.some((appLink) => {
            return appLink.targets.some((t) => {
              if (t.target === keyNoHigh) {
                if (
                  filteredPartitions[appLink.source] &&
                  !filteredPartitions[appLink.source].hasOwnProperty(keyNoHigh)
                ) {
                  filteredPartitions[appLink.source] = {
                    ...filteredPartitions[appLink.source],
                    [keyNoHigh]: val + 0.001,
                  };
                  return true; // Break the inner loop and outer loop
                }
              }
              return false;
            });
          });
        } else {
          // If the key exists only in communities with zero values, add it to the filteredPartitions object
          filteredPartitions[key] = {
            ...filteredPartitions[key],
            [keyNoHigh]: val,
          };
        }
      }
    });
  }

  return filteredPartitions;
};

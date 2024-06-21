import { avgProbability, calculateAffinities } from './affinitiesFunc';
import { modularity } from './modularity';
import { updateMembershipMatrix } from './updateMembershipMatrix';

const modSoft = async () => {
  const prometheusIp = '10.106.109.230:9090';
  const namespace = 'online-boutique';

  let retriesModsoft = 0;
  let success = 0; // success in each function that runs

  while (retriesModsoft < 5 && success < 1) {
    const graphDataLinks = await calculateAffinities(prometheusIp, namespace);

    if (!graphDataLinks) {
      retriesModsoft = retriesModsoft + 1;
      continue;
    }
    success = success + 1;

    const graphDataAvgProb = avgProbability(graphDataLinks);

    let modPartitions: { [key: string]: { [key: string]: number } } = {};
    let maxModularity = -Infinity;
    for (let i = 0; i < 5; i++) {
      const partitions = updateMembershipMatrix(graphDataAvgProb);
      const modularityQ = modularity(graphDataAvgProb);

      // TODO: maybe add a condition to stop the loop and return the best partitions
      if (modularityQ > maxModularity) {
        modPartitions = partitions;
        maxModularity = modularityQ;
      }
      console.log(modularityQ);
    }

    console.log(JSON.stringify(graphDataAvgProb, null, 2));
    console.log(modPartitions);
    console.log(maxModularity);

    // TODO create partitions for each source using communitiesProb
  }
};

//https://www.youtube.com/watch?v=QfTxqAxJp0U&ab_channel=AndrewBeveridge
//https://www.youtube.com/watch?v=Xt0vBtBY2BU&ab_channel=Splience

modSoft();

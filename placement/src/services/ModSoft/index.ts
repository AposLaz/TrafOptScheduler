import {
  avgProbability,
  calculateAffinitiesForExBytesAndSizeMsgs,
} from './affinitiesExBytesSizeMsg';

const modSoft = async () => {
  const prometheusIp = '10.106.109.230:9090';
  const namespace = 'online-boutique';

  let retriesModsoft = 0;
  let success = 0; // success in each function that runs

  while (retriesModsoft < 5 && success < 1) {
    const graphDataLinks = await calculateAffinitiesForExBytesAndSizeMsgs(
      prometheusIp,
      namespace
    );

    if (!graphDataLinks) {
      retriesModsoft = retriesModsoft + 1;
      continue;
    }
    success = success + 1;

    const graphDataAvgProb = avgProbability(graphDataLinks);
    console.log(JSON.stringify(graphDataAvgProb, null, 2));
  }
};

modSoft();

import {
  avgProbability,
  calculateAffinitiesForExBytesAndSizeMsgs,
} from './affinitiesExBytesSizeMsg';
import { updateMembershipMatrix } from './services';

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
    updateMembershipMatrix(graphDataAvgProb);
  }
};

//https://www.youtube.com/watch?v=QfTxqAxJp0U&ab_channel=AndrewBeveridge
//https://www.youtube.com/watch?v=Xt0vBtBY2BU&ab_channel=Splience

modSoft();

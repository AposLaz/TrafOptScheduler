import { calculateAffinitiesForExBytesAndSizeMsgs } from './affinitesExBytesSizeMsg';

const modSoft = async () => {
  const prometheusIp = '10.106.109.230:9090';
  const namespace = 'online-boutique';

  const exBytesSizeMsgAffinities =
    await calculateAffinitiesForExBytesAndSizeMsgs(prometheusIp, namespace);

  console.log(JSON.stringify(exBytesSizeMsgAffinities, null, 2));
};

modSoft();

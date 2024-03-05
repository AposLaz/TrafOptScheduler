import { gkeSetupConfigs } from "./config/setup";
import {
  setUpGraphLinks,
  setUpNodeNameLabelsToPods,
  trafficAllocation,
} from "./services/trafficSplit";
import { SetupGkeConfigs } from "./types";
// import { getK8sData } from "./getK8sData";

/**
 * IN THE END WE WILL HAVE THIS OBJECT FOR EVERY CLUSTER
 */
/**
 * [{
 *  cluster_ip: string,
 *  nodes: [{
 *    node_name: string,
 *    cpu: {
 *      requested_cpu: float, //cpu that need all pods in every node
 *      node_available_cpu: float,  //available cpu for use in every node
 *      max_cpu: float //max cpu that can be used for pods in every node
 *    },
 *    memory: {
 *      requested_memory: float, //memory that need all pods in every node
 *      node_available_memory: float, //available memory for use in every node
 *      max_memory: float  // max memory that can be used for pods in every node
 *    }
 *  }]
 * }]
 */

const setTrafficSplit = async () => {
  //TODO => for each namespace
  const ns = "online-boutique";
  const links = await setUpGraphLinks(ns);
  if (!links) {
    console.error("There is not graph for this namespace");
    return;
  }
  //add label nodeName to each pod
  await setUpNodeNameLabelsToPods(links, ns);

  await Promise.all(links.map((clusterPods) => trafficAllocation(clusterPods)));
};

const initPlacement = async () => {
  //const clusterData = await getK8sData(); //need run this for get Kubernetes Data
  //console.log(JSON.stringify(clusterData));
  // await getPrometheusIp();
  // await main();
};
export let setupConfigs: SetupGkeConfigs;

const initSetup = async () => {
  try {
    // Retrieve Istio IP asynchronously
    setupConfigs = await gkeSetupConfigs();

    await setTrafficSplit();
    await initPlacement();
  } catch (error) {
    console.error("Error during setup:", error);
  }
};

initSetup();

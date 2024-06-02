/* eslint-disable @typescript-eslint/no-unused-vars */
import kubernetesApi from './api/k8s/kubernetesApi';
import { logger } from './config/logger';
import { gkeSetupConfigs } from './config/setup';
import {
  setUpGraphLinks,
  setupDestinationRulesPerZone,
  trafficAllocation,
} from './services/trafficSplit';
import { SetupGkeConfigs } from './types';
import { setupWatchers } from './watchers';
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

const setTrafficSplit = async (region: string) => {
  //TODO => for each namespace
  const ns = 'default';

  const links = await setUpGraphLinks(ns);
  if (!links) {
    logger.error('There is not graph for this namespace');
    return;
  }

  const trafficAllocPerLink = links.map((clusterPods) =>
    trafficAllocation(clusterPods)
  );
  logger.info(JSON.stringify(trafficAllocPerLink, null, 2));
  setupDestinationRulesPerZone(trafficAllocPerLink, ns, region);
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
    const currentRegion = await kubernetesApi.getClusterRegion();

    if (!currentRegion) return;

    await setTrafficSplit(currentRegion);
    await initPlacement();
  } catch (error: unknown) {
    logger.error('Error during setup:', error);
  }
};

setupWatchers();

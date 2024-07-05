/* eslint-disable @typescript-eslint/no-unused-vars */
import kubernetesApi from './api/k8s/kubernetesApi';
import { app } from './app';
import { Config } from './config/config';
import { logger } from './config/logger';
import { gkeSetupConfigs } from './config/setup';
import { modSoft } from './services/modSoft';
import {
  setUpGraphLinks,
  setupDestinationRulesPerZone,
  trafficAllocation,
} from './services/trafficGenerator/trafficSplit';
import { SetupGkeConfigs } from './types';
import { setupWatchers } from './watchers';

const initRestApi = async () => {
  app.listen(Config.APP_PORT, () => {
    logger.info(`LPA api is running in port: ${Config.APP_PORT}`);
  });
};

initRestApi().catch((error: unknown) => {
  const err = error as Error;
  logger.error(`Could not setup api ${err.message}`);
});

setupWatchers().catch((error: unknown) => {
  const err = error as Error;
  logger.error(`Could not setup watchers ${err.message}`);
});

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

export let setupConfigs: SetupGkeConfigs;

const initPlacement = async () => {
  await modSoft('online-boutique');
};

const initSetup = async () => {
  try {
    // Retrieve Istio IP asynchronously
    setupConfigs = await gkeSetupConfigs();
    const currentRegion = await kubernetesApi.getClusterRegion();

    if (!currentRegion) return;

    //await setTrafficSplit(currentRegion);
    await initPlacement();
  } catch (error: unknown) {
    logger.error('Error during setup:', error);
  }
};

initSetup();

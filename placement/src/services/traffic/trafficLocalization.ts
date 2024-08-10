// get links in a namespace between pods
// get latency in namespace between pods
// for each pair of upstream and downstream pods get nodes of replica pods and the number

import kubernetesApi from '../../api/k8s/kubernetesApi';
import kialiApi from '../../api/kiali/kialiApi';
import { createLinksForSourceAndTarget } from './services';
import { GraphEdges } from '../../api/kiali/types';
import { logger } from '../../config/logger';
import { ClusterType } from '../types';

export const setUpGraphLinks = async (
  ns: string
): Promise<ClusterType[][] | undefined> => {
  logger.info(`[${ns}] fetch pod links from Kiali...`);
  const getKialiGraph = await kialiApi.getGraph(ns);

  // no graph exists for kiali
  if (
    !getKialiGraph ||
    getKialiGraph.elements.edges.length === 0 ||
    getKialiGraph.elements.nodes.length === 0
  ) {
    return;
  }

  logger.info(
    `[${ns}] get upstream k8s services and downstream k8s services...`
  );
  const graph: GraphEdges[] = createLinksForSourceAndTarget(getKialiGraph, ns);

  //get distinct services from graph
  const distinctServices = [
    ...new Set([
      ...graph.map((mp) => mp.source),
      ...graph.map((mp) => mp.target),
      ,
    ]),
  ].filter((gr) => gr); //remove undefined

  //get pods by each service
  logger.info(`[${ns}] for each service find replica pods and zone...`);

  const svcPods = await Promise.all(
    distinctServices.map(async (svc) => {
      // get pod, node and zone for each service (svc)
      const pods = svc && (await kubernetesApi.getPodsByService(svc, ns));

      // this is not a service but a parent workload that not have a service in front of it
      // fine replica pods, node, zone and region
      if (pods && pods.length === 1 && pods[0] === '') {
        const replicas = await kubernetesApi.getReplicaPodsByDeployment(
          svc,
          ns
        );

        console.log(replicas);
      }

      // this is service and have to find its pods, node, zone and region
      if (pods && pods.length > 0 && pods[0] !== '') {
        // Filter out empty or null pods
        const filteredPods = pods.filter((pod) => pod !== null && pod !== '');

        // For each non-empty pod, get the zone
        const podLocationPromises = filteredPods.map(async (pod) => {
          const podLocation = await kubernetesApi.getRegionZoneNodeByPod(
            pod,
            ns
          );
          if (podLocation) {
            return {
              pod,
              node: podLocation,
              zone: podLocation.zone,
              region: podLocation.region,
            };
          }
        });

        // Wait for all node promises to resolve
        const podLocation = await Promise.all(podLocationPromises);
        console.log(podLocation);
        // Filter out null nodes
        const filteredZones = podLocation.filter((zone) => zone !== null);
        if (filteredZones.length > 0) {
          return {
            svc,
            pods: filteredZones,
          };
        }
      }
    })
  );

  const zoneNames = svcPods
    .flatMap((svc) => svc && svc.pods.map((pod) => pod && pod.zone))
    .filter((svc) => svc !== undefined);

  const distincZones = [...new Set(zoneNames)];

  const clusterUmDmPods: ClusterType[][] = [];

  logger.info(`[${ns}] for each pod define upstream and downstream pods...`);

  graph.forEach((link) => {
    const um = svcPods.find((pod) => pod?.svc === link.source);
    const dm = svcPods.find((pod) => pod?.svc === link.target);

    if (um && dm) {
      // Filter out undefined values from um.pods and dm.pods
      const filteredUmPods = um.pods.filter((pod) => pod !== undefined) as {
        pod: string;
        zone: string;
      }[];

      filteredUmPods.map((pod) => pod);

      const filteredDmPods = dm.pods.filter((pod) => pod !== undefined) as {
        pod: string;
        zone: string;
      }[];

      filteredDmPods.map((pod) => pod);

      const cl: ClusterType[] = [];

      distincZones.forEach((zone) => {
        const umPods = filteredUmPods
          .filter((pd) => pd.zone === zone)
          .map((pd) => ({ name: pd.pod, allocation: 1 }));

        const dmPods = filteredDmPods
          .filter((pd) => pd.zone === zone)
          .map((pd) => ({
            name: pd.pod,
            allocation: 0,
            trafficAccepts: [],
          }));

        cl.push({
          zone: zone as string,
          umSvc: um.svc,
          dmSvc: dm.svc,
          umPods,
          dmPods,
        });
      });

      clusterUmDmPods.push(cl);
    }
  });

  return clusterUmDmPods;
};

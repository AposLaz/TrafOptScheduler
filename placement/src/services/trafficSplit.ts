import {
  ClusterType,
  DMpods,
  DestinationRuleProps,
  TrafficSummaryPerZone,
} from "./types";
import kubernetesApi from "../api/k8s/kubernetesApi";
import kialiApi from "../api/kiali/kialiApi";
import { createLinksForSourceAndTarget } from "../api/kiali/services";
import { GraphEdges } from "../api/kiali/types";
import { to2Digits } from "../commons/helper";
import * as path from "path";
import * as yaml from "js-yaml";
import * as fs from "fs";

export const setUpGraphLinks = async (
  ns: string
): Promise<ClusterType[][] | undefined> => {
  const getKialiGraph = await kialiApi.getGraph(ns);

  // no graph exists for kiali
  if (
    !getKialiGraph ||
    getKialiGraph.elements.edges.length === 0 ||
    getKialiGraph.elements.nodes.length === 0
  ) {
    return;
  }

  const graph: GraphEdges[] = createLinksForSourceAndTarget(getKialiGraph, ns);

  //get distinct services from graph
  const distincServices = [
    ...new Set([
      ...graph.map((mp) => mp.source),
      ...graph.map((mp) => mp.target),
      ,
    ]),
  ].filter((gr) => gr); //remove undefined

  //get pods by each service
  const svcPods = await Promise.all(
    distincServices.map(async (svc) => {
      const pods = svc && (await kubernetesApi.getPodsByService(svc, ns));
      if (pods && pods.length > 0 && svc) {
        // Filter out empty or null pods
        const filteredPods = pods.filter((pod) => pod !== null && pod !== "");

        // For each non-empty pod, get the zone
        const zonePromises = filteredPods.map(async (pod) => {
          const zone = await kubernetesApi.getZoneByNodeByPod(pod, ns);
          if (zone && zone !== "") {
            return {
              pod,
              zone,
            };
          }
        });

        // Wait for all node promises to resolve
        const zones = await Promise.all(zonePromises);

        // Filter out null nodes
        const filteredZones = zones.filter((zone) => zone !== null);
        if (filteredZones.length > 0) {
          return {
            svc,
            pods: filteredZones,
          };
        }
      }
    })
  );

  console.log(JSON.stringify(svcPods, null, 2));

  const zoneNames = svcPods
    .flatMap((svc) => svc && svc.pods.map((pod) => pod && pod.zone))
    .filter((svc) => svc !== undefined);

  const distincZones = [...new Set(zoneNames)];

  const clusterUmDmPods: ClusterType[][] = [];

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

  console.log(JSON.stringify(clusterUmDmPods, null, 2));

  return clusterUmDmPods;
};

export const trafficAllocation = (
  clusterReplicaPods: ClusterType[]
): ClusterType[] => {
  const totalUm = clusterReplicaPods.reduce(
    (totalUm, nodes) => totalUm + nodes.umPods.length,
    0
  );

  const totalDm = clusterReplicaPods.reduce(
    (totalDm, nodes) => totalDm + nodes.dmPods.length,
    0
  );

  //desire ratio of downstream replica pods
  const need = totalUm / totalDm;

  //In cluster allocation
  for (const node of clusterReplicaPods) {
    if (node.umPods.length !== 0 && node.dmPods.length !== 0) {
      const umLength = node.umPods.length;
      const dmLength = node.dmPods.length;
      const nodeNeed = umLength / dmLength;

      //When nodeNeed is greater than or equal to need, it indicates
      //that the node has a sufficient number of UM pods compared to DM pods, possibly even an excess.
      /**
       *
       * If a zone has a sufficient or higher ratio of UM pods compared to
       * the desired overall ratio (need), it proportionally allocates traffic from its UM pods to its DM pods.
       *
       * Ever allocation traffic < 1
       *
       * When the ratio of UMpods to DMpods within a node (nodeNeed)
       * is greater than or equal to the desired overall
       * ratio (need), it means the node has a sufficient
       * or excess number of UMpods relative to
       * DMpods. This scenario allows for a straightforward
       * allocation of traffic from UMpods to
       * DMpods to achieve the desired balance.
       * 
       * Why Divide by UMpods (umLength)?
        When nodeNeed (ratio of UMpods to DMpods within a node) is greater than 
        or equal to need (desired overall ratio), it indicates that the node has enough 
        or more UMpods relative to the DMpods. Therefore, the allocation should focus on 
        distributing the traffic from each UMpod to the DMpods in a way that maintains or approaches the desired ratio.
        Calculation Breakdown:
        Calculate Traffic Allocation per UMpod:
        We need to determine how much traffic each UMpod should allocate to the DMpods to achieve the desired ratio within the node.

       *
       */

      if (nodeNeed >= need) {
        const numAlloc = to2Digits(need / umLength);

        node.dmPods.forEach((dm) =>
          dm.trafficAccepts.push({
            zoneName: node.zone,
            traffic: numAlloc,
          })
        );

        for (const um of node.umPods) {
          for (const dm of node.dmPods) {
            um.allocation = um.allocation - numAlloc;
            dm.allocation = dm.allocation + numAlloc;
          }
        }
      } else {
        const numAlloc = to2Digits(1 / dmLength);
        node.dmPods.forEach((dm) =>
          dm.trafficAccepts.push({
            zoneName: node.zone,
            traffic: numAlloc,
          })
        );

        for (const um of node.umPods) {
          for (const dm of node.dmPods) {
            um.allocation = um.allocation - numAlloc;
            dm.allocation = dm.allocation + numAlloc;
          }
        }
      }
    }
  }

  //Cross cluster allocation
  const getDmPods = clusterReplicaPods.flatMap((node) => node.dmPods);

  //for each downstream replica pod
  for (const dm of getDmPods) {
    if (dm.allocation < need) {
      for (const node of clusterReplicaPods) {
        if (node.umPods.length > 0) {
          //from first um pod in node. That means that if first pod === 0 all the other will be zero
          if (node.umPods[0].allocation > 0) {
            //checks whether the available traffic allocation in the upstream pods where
            //is sufficient to fulfill the remaining demand in the downstream pods
            if (
              node.umPods[0].allocation * node.umPods.length <=
              need - dm.allocation
            ) {
              //update allocation of dm pod
              dm.allocation = to2Digits(
                dm.allocation + node.umPods[0].allocation * node.umPods.length
              );

              //if node already exists in trafficAccepts just update traffic
              const nodeExistsIndex = dm.trafficAccepts.findIndex(
                (n) => n.zoneName === node.zone
              );

              if (nodeExistsIndex !== -1) {
                dm.trafficAccepts[nodeExistsIndex].traffic = to2Digits(
                  dm.trafficAccepts[nodeExistsIndex].traffic + //added after
                    node.umPods[0].allocation
                );
              } else {
                dm.trafficAccepts.push({
                  zoneName: node.zone,
                  traffic: to2Digits(node.umPods[0].allocation),
                });
              }

              //zero all allocation in um pods in this node
              node.umPods.forEach((um) => (um.allocation = 0));
            } else {
              node.umPods.forEach(
                (um) =>
                  (um.allocation = to2Digits(
                    um.allocation - (need - dm.allocation) / node.umPods.length //need only last 2 digits
                  ))
              );

              if ((need - dm.allocation) / node.umPods.length > 0) {
                //if node already exists in trafficAccepts
                const nodeExistsIndex = dm.trafficAccepts.findIndex(
                  (n) => n.zoneName === node.zone
                );

                //if node already exists in trafficAccepts just update traffic
                if (nodeExistsIndex !== -1) {
                  dm.trafficAccepts[nodeExistsIndex].traffic = to2Digits(
                    dm.trafficAccepts[nodeExistsIndex].traffic +
                      (need - dm.allocation) / node.umPods.length
                  );
                } else {
                  dm.trafficAccepts.push({
                    zoneName: node.zone,
                    traffic: to2Digits(
                      (need - dm.allocation) / node.umPods.length
                    ),
                  });
                }

                dm.allocation = to2Digits(need);
              }
            }
          }
        }
      }
    }
  }
  console.log(
    "======================================================================"
  );

  return clusterReplicaPods;
};

export const setupDestinationRulesPerZone = (
  trafficPodsAllocation: ClusterType[][],
  namespace: string,
  region: string
) => {
  for (const link of trafficPodsAllocation) {
    //create destination rule
    const DestinationRule: DestinationRuleProps = {
      apiVersion: "networking.istio.io/v1beta1",
      kind: "DestinationRule",
      metadata: {
        name: link[0].dmSvc, //in which service will apply the role
      },
      spec: {
        host: `${link[0].dmSvc}.${namespace}.svc.cluster.local`,
        trafficPolicy: {
          loadBalancer: {
            localityLbSetting: {
              enabled: true,
              distribute: [
                //here add rules for zones
              ],
            },
          },
          outlierDetection: {
            consecutive5xxErrors: 100,
            interval: "1s",
            baseEjectionTime: "1m",
          },
        },
      },
    };

    for (const podsAllocation of link) {
      //for each dm pod calculate traffic for each zone
      const finalPodsAllocation = calculateTrafficForEachZone(
        podsAllocation.dmPods
      );

      finalPodsAllocation.forEach((allocation) => {
        // if already "from" zone exists just add aa new rule
        const fromZoneExists =
          DestinationRule.spec.trafficPolicy.loadBalancer.localityLbSetting.distribute.find(
            (fromZone) => fromZone.from === `${region}/${allocation.zone}/*`
          );

        if (fromZoneExists) {
          // add new field to "to"
          fromZoneExists.to = {
            ...fromZoneExists.to,
            [`${region}/${podsAllocation.zone}/*`]: allocation.traffic * 100,
          };
        } else {
          DestinationRule.spec.trafficPolicy.loadBalancer.localityLbSetting.distribute.push(
            {
              from: `${region}/${allocation.zone}/*`,
              to: {
                [`${region}/${podsAllocation.zone}/*`]:
                  allocation.traffic * 100,
              },
            }
          );
        }
      });
    }
    applyDestinationRule(DestinationRule, namespace);
  }
};

const calculateTrafficForEachZone = (
  pods: DMpods[]
): TrafficSummaryPerZone[] => {
  const trafficSummary: { [key: string]: number } = {};

  pods.forEach((pod) => {
    pod.trafficAccepts.forEach((traffic) => {
      const zone = traffic.zoneName;
      const trafficAmount = traffic.traffic;

      if (trafficSummary[zone]) {
        trafficSummary[zone] += trafficAmount;
      } else {
        trafficSummary[zone] = trafficAmount;
      }
    });
  });

  return Object.keys(trafficSummary).map((zone) => ({
    zone: zone,
    traffic: trafficSummary[zone],
  }));
};

// Function to apply the destination rule
const applyDestinationRule = async (
  destinationRule: DestinationRuleProps,
  namespace: string
) => {
  const yamlStr = yaml.dump(destinationRule);
  const destRulesPath = path.join(__dirname, "..", "destinationRules");
  const filePath = path.join(
    destRulesPath,
    `${destinationRule.metadata.name}.yaml`
  );

  console.log(yamlStr);
  console.log(filePath);

  fs.writeFileSync(filePath, yamlStr, "utf8");

  await kubernetesApi.createResource(filePath, namespace);
};

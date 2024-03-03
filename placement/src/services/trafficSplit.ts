import { ClusterType } from "../algorithms/types";
import kubernetesApi from "../api/k8s/kubernetesApi";
import kialiApi from "../api/kiali/kialiApi";
import { createLinksForSourceAndTarget } from "../api/kiali/services";
import { GraphEdges } from "../api/kiali/types";
import { to2Digits } from "../commons/helper";

export const setUpGraphLinks = async (
  ns: string
): Promise<ClusterType[][] | undefined> => {
  const getKialiGraph = await kialiApi.getGraph(ns);
  if (!getKialiGraph) return;

  const graph: GraphEdges[] = await createLinksForSourceAndTarget(
    getKialiGraph,
    ns
  );

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

        // For each non-empty pod, get the node
        const nodePromises = filteredPods.map(async (pod) => {
          const node = await kubernetesApi.getNodeByPod(pod, ns);
          if (node && node !== "") {
            return {
              pod,
              node,
            };
          }
        });

        // Wait for all node promises to resolve
        const nodes = await Promise.all(nodePromises);

        // Filter out null nodes
        const filteredNodes = nodes.filter((node) => node !== null);
        if (filteredNodes.length > 0) {
          return {
            svc,
            pods: filteredNodes,
          };
        }
      }
    })
  );

  const nodeNames = svcPods
    .flatMap((svc) => svc && svc.pods.map((pod) => pod && pod.node))
    .filter((svc) => svc !== undefined);

  const distincNodes = [...new Set(nodeNames)];

  const clusterUmDmPods: ClusterType[][] = [];

  graph.forEach((link) => {
    const um = svcPods.find((pod) => pod?.svc === link.source);
    const dm = svcPods.find((pod) => pod?.svc === link.target);

    if (um && dm) {
      // Filter out undefined values from um.pods and dm.pods
      const filteredUmPods = um.pods.filter((pod) => pod !== undefined) as {
        pod: string;
        node: string;
      }[];

      filteredUmPods.map((pod) => pod);

      const filteredDmPods = dm.pods.filter((pod) => pod !== undefined) as {
        pod: string;
        node: string;
      }[];

      filteredDmPods.map((pod) => pod);

      const cl: ClusterType[] = [];

      distincNodes.forEach((node) => {
        const umPods = filteredUmPods
          .filter((pd) => pd.node === node)
          .map((pd) => ({ name: pd.pod, allocation: 1 }));

        const dmPods = filteredDmPods
          .filter((pd) => pd.node === node)
          .map((pd) => ({
            name: pd.pod,
            allocation: 0,
            trafficAccepts: [],
          }));

        cl.push({
          node: node as string,
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

export const trafficAllocation = (clusterReplicaPods: ClusterType[]) => {
  const totalUm = clusterReplicaPods.reduce(
    (totalUm, nodes) => totalUm + nodes.umPods.length,
    0
  );

  const totalDm = clusterReplicaPods.reduce(
    (totalDm, nodes) => totalDm + nodes.dmPods.length,
    0
  );

  const need = totalUm / totalDm;

  //In cluster allocation
  for (const node of clusterReplicaPods) {
    if (node.umPods.length !== 0 && node.dmPods.length !== 0) {
      const umLength = node.umPods.length;
      const dmLength = node.dmPods.length;
      const nodeNeed = umLength / dmLength;

      if (nodeNeed >= need) {
        const numAlloc = to2Digits(need / umLength);

        node.dmPods.forEach((dm) =>
          dm.trafficAccepts.push({
            nodeName: node.node,
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
            nodeName: node.node,
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
            if (
              node.umPods[0].allocation * node.umPods.length <=
              need - dm.allocation
            ) {
              //update allocation of dm pod
              dm.allocation = to2Digits(
                dm.allocation + node.umPods[0].allocation * node.umPods.length
              );

              //if node already exists in trafficAccepts
              const nodeExistsIndex = dm.trafficAccepts.findIndex(
                (n) => n.nodeName === node.node
              );

              if (nodeExistsIndex !== -1) {
                dm.trafficAccepts[nodeExistsIndex].traffic = to2Digits(
                  node.umPods[0].allocation
                );
              } else {
                dm.trafficAccepts.push({
                  nodeName: node.node,
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
                  (n) => n.nodeName === node.node
                );

                if (nodeExistsIndex !== -1) {
                  dm.trafficAccepts[nodeExistsIndex].traffic = to2Digits(
                    (need - dm.allocation) / node.umPods.length
                  );
                } else {
                  dm.trafficAccepts.push({
                    nodeName: node.node,
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
  console.log(JSON.stringify(clusterReplicaPods, null, 2));
};

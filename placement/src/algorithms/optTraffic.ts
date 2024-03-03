/** GOAL
 *
 *  all upstream containers should send the "same amount" of traffic, and all
 *  downstream containers should also receive the "same amount" of traffic in a node.
 *
 *  Every pod has many replicas.
 *
 *  @need => the desired ratio of upstream containers of a pod to downstream containers of a pod.
 *  need = cluster upstream containers of a pod/ cluster downstream containers of a pod
 *
 */

import { to2Digits } from "./helpers";

type ClusterType = {
  node: string;
  umPods: {
    name: string;
    allocation: number;
  }[];
  dmPods: {
    name: string;
    allocation: number;
    trafficAccepts: { traffic: number; nodeName: string }[];
  }[];
};

// const cluster: ClusterType[] = [
//   {
//     node: "node1",
//     umPods: [
//       {
//         name: "A1",
//         allocation: 1,
//       },
//     ],
//     dmPods: [
//       { name: "B1", allocation: 0, trafficAccepts: [] },
//       { name: "B2", allocation: 0, trafficAccepts: [] },
//     ],
//   },
//   {
//     node: "node2",
//     umPods: [
//       {
//         name: "A2",
//         allocation: 1,
//       },
//       {
//         name: "A3",
//         allocation: 1,
//       },
//     ],
//     dmPods: [
//       { name: "B3", allocation: 0, trafficAccepts: [] },
//       { name: "B4", allocation: 0, trafficAccepts: [] },
//       { name: "B5", allocation: 0, trafficAccepts: [] },
//     ],
//   },
// ];

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
  console.log(JSON.stringify(clusterReplicaPods, null, 2));
};

//trafficAllocation();

/**
 function __iptables(link: str):
    um, dm = split_link(link)
    um_list, dm_list = [], []

    // Get the list of pods in the namespace
    vertices_set = get_PODList_namespace(self.graph.MSName)
    
    // Remove None key from VerticesSet dictionary
    remove_None_key(self.graph.VerticesSet)
    
    // Iterate through the pods to separate upstream and downstream pods
    for pod in vertices_set:
        if pod starts with um and the next character is '-', add pod to um_list
        if pod starts with dm and the next character is '-', add pod to dm_list
    
    // Get the node information for each pod
    pod_node = get_POD_Node_namespace(self.graph.MSName)
    
    // Remove nodes that are not in um_list or dm_list
    remove_unused_nodes(pod_node, um_list, dm_list)

    // Generate node_um_dm dictionary to store upstream and downstream pods for each node
    node_um_dm = generate_node_um_dm(pod_node, um_list, dm_list)

    // Initialize arrays um and dm to store traffic allocation ratios
    initialize_arrays(um, dm, um_list, dm_list)

    // Calculate the desired ratio of upstream pods to downstream pods
    need = calculate_ratio(um_list, dm_list)

    // Allocate traffic within each node
    allocate_traffic_within_node(node_um_dm, um_list, dm_list, need)

    // Allocate traffic between nodes
    allocate_traffic_between_nodes(dm_list, um_list, node_um_dm, need)

// Helper functions

function split_link(link: str) -> Tuple[str, str]:
    // Split the link into upstream and downstream components
    return link.split('~')

function remove_None_key(vertices_set: Dict[str, Vertices]):
    // Remove the None key from the VerticesSet dictionary
    if None in vertices_set.keys():
        delete vertices_set[None]

function remove_unused_nodes(pod_node: Dict[str, str], um_list: List[str], dm_list: List[str]):
    // Remove nodes that are not in um_list or dm_list from the pod_node dictionary
    for key in pod_node.keys():
        if key not in um_list and key not in dm_list:
            delete pod_node[key]

function generate_node_um_dm(pod_node: Dict[str, str], um_list: List[str], dm_list: List[str]) -> Dict[str, List[List[str], List[str]]]:
    // Generate node_um_dm dictionary to store upstream and downstream pods for each node
    node_um_dm = {}
    for pod, node in pod_node.items():
        if node not in node_um_dm:
            node_um_dm[node] = [[], []]
        if pod in um_list:
            node_um_dm[node][0].append(pod)
        if pod in dm_list:
            node_um_dm[node][1].append(pod)
    return node_um_dm

function initialize_arrays(um: List[int], dm: List[int], um_list: List[str], dm_list: List[str]):
    // Initialize arrays um and dm with ones and zeros respectively
    um = array of ones with length equal to length of um_list
    dm = array of zeros with length equal to length of dm_list

function calculate_ratio(um_list: List[str], dm_list: List[str]) -> float:
    // Calculate the desired ratio of upstream pods to downstream pods
    return float(length of um_list) / float(length of dm_list)

function allocate_traffic_within_node(node_um_dm: Dict[str, List[List[str], List[str]]], um_list: List[str], dm_list: List[str], need: float):
    // Allocate traffic within each node
    for node, pods in node_um_dm.items():
        if length of upstream pods and downstream pods is not equal to zero:
            if ratio of upstream pods to downstream pods is greater than or equal to need:
                for each downstream pod in node:
                    allocate traffic between upstream and downstream pods
                for each upstream pod in node:
                    update traffic allocation ratios in um and dm arrays
            else:
                for each downstream pod in node:
                    allocate traffic based on the ratio of downstream pods
                for each upstream pod in node:
                    allocate traffic based on the ratio of downstream pods

function allocate_traffic_between_nodes(dm_list: List[str], um_list: List[str], node_um_dm: Dict[str, List[List[str], List[str]]], need: float):
    // Allocate traffic between nodes
    for each downstream pod in dm_list:
        if traffic allocation for downstream pod is less than need:
            for each node with upstream pods:
                if there are upstream pods available:
                    if traffic allocation for upstream pods is sufficient:
                        allocate traffic between upstream and downstream pods
                        update traffic allocation ratios
                    else:
                        allocate remaining traffic based on available upstream pods


  
 */

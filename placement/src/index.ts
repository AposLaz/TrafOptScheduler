// import kubernetesApi from "./api/k8s/kubernetesApi";
// import { Config } from "./environement";
import { getK8sData } from "./getK8sData";
// import { PROMETHEUS_NODE_INFO } from "./gke_metrics";
// import { ClusterTypes } from "./types";

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
// const clusters: Array<ClusterTypes> = [];

// const main = async () => {
//   //WE GET IP FOR EVERY CLUSTER
//   await Promise.all(
//     Config.CLUSTERS_IP.map((ip) => {
//       clusters.push({
//         cluster_ip: ip,
//         nodes: [],
//       });
//     })
//   );
//   //get node information from prometheus
//   // clusters = await PROMETHEUS_NODE_INFO(clusters);
//   clusters.map((cl) => {
//     cl.nodes.map((node) => console.log(node));
//   });

//   // const { spawn } = require("child_process");

//   // const child = spawn("ls", ["-a", "-l"]);
// };

const initPlacement = async () => {
  const clusterData = await getK8sData();
  console.log(JSON.stringify(clusterData));
  // await getPrometheusIp();
  // await main();
};

initPlacement();

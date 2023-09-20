const {CLUSTERS_IP}=require('./environement')
const PROMETHEUS_NODE_INFO = require('./gke_metrics')

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
let clusters =  []


const main = async()=>{
    //WE GET IP FOR EVERY CLUSTER 
    await Promise.all(CLUSTERS_IP.map((ip,index)=>{
        clusters[index] = {
            cluster_ip: ip,
            nodes: []
           } 
    }))
    //get node information from prometheus
    clusters = await PROMETHEUS_NODE_INFO(clusters)
    clusters.map((cl)=>{
        cl.nodes.map((node=>console.log(node)))
    })
}

main()

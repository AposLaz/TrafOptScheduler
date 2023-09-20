/**
 * @PROMETHEUS_NODE_INFO = collect metrics for every node and every Kubernetes cluster from prometheus
 *      metrics: 
 *          @requested_cpu = cpu that need all pods in every node
 *          @requested_memory = memory that need all pods in every node
 *          @max_cpu = max cpu that can be used for pods in every node
 *          @max_memory = max memory that can be used for pods in every node
 *          @node_available_cpu = available cpu for use in every node
 *          @node_available_memory = available memory for use in every node
 */

const axios=require('axios');   

/**
 * Function to collect Kubernetes metrics from prometheus
 */
const PROMETHEUS_NODE_INFO = async (clusters)=>{

    /**
     * GET ALL NODEs that run CPU REQUESTS (HOW much cpu need pods in every node) 
     * @requested_cpu
    */
    await Promise.all(clusters.map(async (cp,index)=>{
        const cpu_nodes = await axios.get(`http://${cp.cluster_ip}/prometheus/api/v1/query`,{
            params: { query: 'sum(kube_pod_container_resource_requests{resource="cpu"}) by (node)' }
        })
     
        cpu_nodes.data.data.result.sort((a,b)=>a.metric.node.localeCompare(b.metric.node)).map((nodes_data,i)=>{
            clusters[index].nodes[i] = {
                node_name: nodes_data.metric.node,
                cpu: { 
                    requested_cpu: Number(nodes_data.value[1])
                }
            }
        })
    }))

    /**
     * GET ALL NODES MEMORY REQUESTS (HOW much cpu need pods in every node) 
     * @requested_memory
    */
    await Promise.all(clusters.map(async (cp,index)=>{
        //get memory
        const memory_nodes = await axios.get(`http://${cp.cluster_ip}/prometheus/api/v1/query`,{
            params: { query: 'sum(kube_pod_container_resource_requests{resource="memory"}) by (node)' }
        })

        memory_nodes.data.data.result.sort((a,b)=>a.metric.node.localeCompare(b.metric.node)).map((nodes_data,i)=>{
            clusters[index].nodes[i].memory = { 
                requested_memory: Number(nodes_data.value[1])
            }
        })
    }))

    /**
     * The amount of resources allocatable for pods (after reserving some for system daemons)
     * How much is the initial space for cpu and memory for PODs.
     * go check GKE per Node
     */
    await Promise.all(clusters.map(async (cp,index)=>{
        //allocable pods cpu
        const cpu_nodes = await axios.get(`http://${cp.cluster_ip}/prometheus/api/v1/query`,{
            params: { query: 'kube_node_status_allocatable{resource="cpu"}' }
        })

        cpu_nodes.data.data.result.sort((a,b)=>a.metric.node.localeCompare(b.metric.node)).map((nodes_data,i)=>{
            clusters[index].nodes[i].cpu.max_cpu = Number(nodes_data.value[1])
        })

    }))

    await Promise.all(clusters.map(async (cp,index)=>{
        //allocable pods memory
        const memory_nodes = await axios.get(`http://${cp.cluster_ip}/prometheus/api/v1/query`,{
            params: { query: 'kube_node_status_allocatable{resource="memory"}' }
        })

        memory_nodes.data.data.result.sort((a,b)=>a.metric.node.localeCompare(b.metric.node)).map((nodes_data,i)=>{
            clusters[index].nodes[i].memory.max_memory = Number(nodes_data.value[1])
        })
    }))

    /**
     * REMAIN CPU and MEMORY
     * REMAIN_CPU = max_cpu - requested_cpu
     * REMAIN_MEMORY = max_memory - requested_memory
     */
    await Promise.all(clusters.map(async (cp)=>{
        //calculate available memry and cpu
        cp.nodes.map((node)=>{
            //cpu
            node.cpu.node_available_cpu = node.cpu.max_cpu - node.cpu.requested_cpu
            //memory
            node.memory.node_available_memory = node.memory.max_memory - node.memory.requested_memory
        })
    }))

    return clusters
}

module.exports = PROMETHEUS_NODE_INFO

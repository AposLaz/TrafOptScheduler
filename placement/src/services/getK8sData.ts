import kubernetesApi from '../api/k8s/kubernetesApi';
import prometheusApi from '../api/prometheus/prometheusApi';
import { convertCPUtoCores, convertRAMtoGB } from '../common/helper';
import { Deploys, KubernetesData } from '../types';

export async function getK8sData(): Promise<KubernetesData[]> {
  try {
    //fetch all clusters context
    const k8sData: KubernetesData[] = [];

    const kubeContexts = await kubernetesApi.getContextNames();
    if (!kubeContexts) {
      throw new Error('[ERROR] => fetching context name from K8s API');
    }

    await Promise.all(
      kubeContexts.map((context) => {
        const contextJSON = { context: context, info: [], prometheusIP: '' };
        k8sData.push(contextJSON);
      })
    );

    //structure data for nodes and deploys
    for (const context of kubeContexts) {
      //for each context/cluster
      await kubernetesApi.useContext(context);

      //get nodes
      const getAllNodesForEachContext =
        await kubernetesApi.getAllNodesForEachContext();

      if (!getAllNodesForEachContext) {
        throw new Error('[ERROR] => fetching nodes name from K8s API');
      }

      //index of each context in k8sData array
      const clusterIndex = k8sData.findIndex((ctx) => ctx.context === context);

      //for each context get Prometheus ip and store it in cluster
      const prometheusIp = await prometheusApi.getPrometheusIpAddress();

      if (!prometheusIp) {
        throw new Error(
          '[ERROR] => fetching prometheus IP from Prometheus API'
        );
      }

      k8sData[clusterIndex].prometheusIP = prometheusIp;

      //assign nodes to the right context
      await Promise.all(
        getAllNodesForEachContext.map((nodeName) => {
          const node = { node: nodeName, deploys: [] };
          //for each deploy add nodes
          k8sData[clusterIndex].info.push(node);
        })
      );

      //get namespaces expect defaults for context
      const getAllDeployNamespaces =
        await kubernetesApi.getAllNamespacesForDeploys();

      if (!getAllDeployNamespaces) {
        throw new Error('[ERROR] => fetching namespaces from K8s API');
      }

      await Promise.all(
        getAllDeployNamespaces.map(async (namespace) => {
          //get pods for each cluster
          const getDeploys = await kubernetesApi.getAllDeployJSONFromNamespace(
            namespace
          );

          if (!getDeploys) {
            throw new Error('[ERROR] => fetching deployments from K8s API');
          }
          //for each namespace get pods cpu usage
          const inUseCPU =
            await prometheusApi.getPrometheusCPUusageForAllPodsInNamespace(
              k8sData[clusterIndex].prometheusIP,
              namespace
            );

          if (!inUseCPU) {
            throw new Error('[ERROR] => fetching inUseCPU from Prometheus API');
          }

          const inUseRAM =
            await prometheusApi.getPrometheusRAMusageForAllPodsInNamespace(
              k8sData[clusterIndex].prometheusIP,
              namespace
            );

          if (!inUseRAM) {
            throw new Error('[ERROR] => fetching inUseRAM from Prometheus API');
          }

          if (
            getDeploys.length > 0 &&
            inUseCPU.length > 0 &&
            inUseRAM.length > 0
          ) {
            //for each deploy insert in array info -> deploys -> name & namespace
            await Promise.all(
              getDeploys.map(async (deploy) => {
                const removeVersionOfDeploy = deploy.metadata.name.slice(0, -3);

                //find node that each deploy run
                const getNodeForDeploy = await kubernetesApi.getDeploysNodes(
                  removeVersionOfDeploy,
                  namespace
                );

                if (!getNodeForDeploy) {
                  throw new Error(
                    '[ERROR] => fetching Nodes for Each Deploy from K8s API'
                  );
                }

                //get index Of node
                const nodeIndex = k8sData[clusterIndex].info.findIndex(
                  (node) => node.node === getNodeForDeploy
                );

                //convert cpu to cores instead of millicores
                const cpuDeployReq = convertCPUtoCores(
                  deploy.spec.template.spec.containers[0].resources.requests.cpu
                );
                const cpuDeployLimit = convertCPUtoCores(
                  deploy.spec.template.spec.containers[0].resources.limits.cpu
                );
                const findDeployMetricsCPU = inUseCPU.find((data) =>
                  data.pod.includes(deploy.metadata.name)
                );
                const cpuInUse = findDeployMetricsCPU?.metric || 0;

                //convert RAM to GB instead of Mi
                const ramDeployReq = convertRAMtoGB(
                  deploy.spec.template.spec.containers[0].resources.requests
                    .memory
                );
                const ramDeployLimit = convertRAMtoGB(
                  deploy.spec.template.spec.containers[0].resources.limits
                    .memory
                );
                const findDeployMetricsRAM = inUseCPU.find((data) =>
                  data.pod.includes(deploy.metadata.name)
                );
                const ramInUse = findDeployMetricsRAM?.metric || 0;

                const deployData: Deploys = {
                  name: deploy.metadata.name,
                  namespace: namespace,
                  metrics: {
                    cpu: {
                      requested: cpuDeployReq,
                      limit: cpuDeployLimit,
                      in_use: cpuInUse,
                    },
                    ram: {
                      requested: ramDeployReq,
                      limit: ramDeployLimit,
                      in_use: ramInUse,
                    },
                  },
                };

                //add name and namespace for each deployment
                k8sData[clusterIndex].info[nodeIndex].deploys.push(deployData);
              })
            );
          }
        })
      );
    }

    // const endDate = Date.now();
    // const diff = (endDate - start) / 1000;
    // console.log(start);
    // console.log(endDate);
    // console.log(diff);
    return k8sData;
  } catch (e) {
    console.log(e);
    throw new Error('[ERROR]=> Running getK8sData function');
  }
}

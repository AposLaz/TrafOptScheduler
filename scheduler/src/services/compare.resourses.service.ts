import {
  getNodesResources,
  getPodsCurrentResources,
} from './metrics/cpu.ram.resources.service';
import * as k8s from '@kubernetes/client-node';
import { appsLatency } from './metrics/latency.service';
import { logger } from '../config/logger';
import { deploymentMatchLabels } from './k8s/k8s.deploy.service';
import { getPodsByLabels } from './k8s/k8s.pod.service';
import { DeploymentLabels, DeploymentReplicasData } from '../types';

export const reschedulePods = async (
  apiK8sClient: k8s.CoreV1Api,
  appsApiK8sClient: k8s.AppsV1Api,
  namespace: string
) => {
  const pods = await getPodsCurrentResources(apiK8sClient, namespace);
  const nodes = await getNodesResources(apiK8sClient);

  // const kialiSvc = await getSvc(
  //   apiK8sClient,
  //   Config.KIALI_SVC,
  //   Config.KIALI_NAMESPACE
  // );
  // const port = kialiSvc.ports!.find((p) => p.name === 'http');

  // const kialiIp =
  //   Config.ENV === 'production'
  //     ? `${kialiSvc.clusterIp}:${port!.port}`
  //     : `${kialiSvc.externalIp![0].ip}:${port!.port}`;

  // console.log(kialiIp);
  // // Sample JSON data
  // const nsData: GraphData | undefined = await kialiApi.getGraphMetrics(
  //   kialiIp,
  //   namespace
  // );

  // console.log(JSON.stringify(nsData, null, 2));
  // if (!nsData) return;

  // const getResponseTimes = await appResponseTimes(nsData);
  // console.log(getResponseTimes);

  /**************LATENCY **************/
  const latency = await appsLatency(apiK8sClient, namespace);
  console.log(latency);
  if (!latency) return;

  // get distinct sources because there is not other way to identify the upstream replica pods of a node

  const distinctSources = [...new Set(latency.map((l) => l.source))];
  console.log(distinctSources);

  const sourceDeploymentLabels: DeploymentLabels[] = [];

  // for each distinct source deployment get matching labels
  for (const source of distinctSources) {
    const sourceDeployments = await deploymentMatchLabels(
      appsApiK8sClient,
      source,
      namespace
    );

    if (!sourceDeployments) {
      logger.error(
        `Error getting matching deployment ${source} for labels in namespace: ${namespace}`
      );
      continue;
    }

    sourceDeploymentLabels.push({
      deployment: source,
      matchLabels: sourceDeployments,
    });
  }

  // for each source deployment matching labels get the number of replica pods and their nodes
  // currently plays only with (APP) label

  const sourceDeploymentRsData: DeploymentReplicasData[] = [];

  for (const source of sourceDeploymentLabels) {
    const label = `app=${source.matchLabels.app}`;
    const replicas = await getPodsByLabels(apiK8sClient, namespace, label);

    if (!replicas) {
      logger.error(
        `No matching labels ${label} for deployment ${source.deployment}`
      );
    }

    const replicasData = replicas!.map((p) => {
      return {
        name: p.metadata!.name,
        node: p.spec!.nodeName,
      };
    });

    sourceDeploymentRsData.push();
  }
};

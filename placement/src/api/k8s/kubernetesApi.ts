import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import {
  createArrayFromStringWithNewLine,
  createArrayFromStringWithSpace,
} from '../../common/helper';
import { DeployList, DeploymentType, podLocation } from './types';
import { logger } from '../../config/logger';

const promisifiedExecFile = promisify(execFile);

const kubernetesDefaultNamespaces = [
  'asm-system',
  'gke-mcs',
  'gmp-public',
  'gmp-system',
  'ingress-nginx',
  'istio-gateway',
  'istio-system',
  'kube-node-lease',
  'kube-public',
  'kube-system',
];

class KubernetesApi {
  //cluster: string, zone: string, project: string
  async getContextNames(): Promise<string[] | undefined> {
    //get kube configs
    try {
      const { stdout } = await promisifiedExecFile('kubectl', [
        'config',
        'get-contexts',
        '-o',
        'name',
      ]);

      const results = createArrayFromStringWithNewLine(stdout);
      return results;
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('stderr:', error.message);
      return undefined;
    }
  }

  async useContext(context: string) {
    try {
      const command = `kubectl config use-context ${context}`;
      await promisifiedExecFile('bash', ['-c', command]);
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('stderr:', error.message);
      throw new Error('[ERROR] => Switch Context from K8s API');
    }
  }

  async getAllNodesForEachContext() {
    try {
      const command = `kubectl get nodes -o=jsonpath='{.items[*].metadata.name}'`;
      const { stdout } = await promisifiedExecFile('bash', ['-c', command]);
      const results = createArrayFromStringWithSpace(stdout);
      return results;
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('stderr:', error.message);
      return undefined;
    }
  }

  async getAllNamespacesForDeploys(): Promise<string[] | undefined> {
    try {
      const command = `kubectl get ns -o=jsonpath='{.items[*].metadata.name}'`;
      const { stdout } = await promisifiedExecFile('bash', ['-c', command]);
      const strArray = createArrayFromStringWithSpace(stdout);
      //get only namespaces that are for deploy apps
      const results = strArray.filter(
        (strNs) => !kubernetesDefaultNamespaces.some((ns) => ns === strNs)
      );
      return results;
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('stderr:', error.message);
      return undefined;
    }
  }

  async getAllDeployJSONFromNamespace(
    namespace: string
  ): Promise<DeploymentType[] | undefined> {
    try {
      const command = `kubectl get deploy -n ${namespace} -o json`;
      const { stdout } = await promisifiedExecFile('bash', ['-c', command]);
      const json: DeployList = JSON.parse(stdout);

      return json.items;
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('stderr:', error.message);
      return undefined;
    }
  }

  async getDeploymentsFromNamespace(
    namespace: string
  ): Promise<string[] | undefined> {
    try {
      const { stdout } = await promisifiedExecFile('kubectl', [
        'get',
        'deploy',
        '-n',
        namespace,
        '-o=jsonpath={.items[*].metadata.name}',
      ]);

      const results = createArrayFromStringWithSpace(stdout);
      return results;
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('stderr:', error.message);
      return undefined;
    }
  }

  async getDeployRequestedAndLimitCPU(
    deploy: string,
    namespace: string
  ): Promise<number[] | undefined> {
    try {
      const command = `kubectl get deploy ${deploy} -n ${namespace} -o=jsonpath='{range .spec.template.spec.containers[*]}{.resources.requests.cpu}{" "}{.resources.limits.cpu}{" "}{end}'`;
      const { stdout } = await promisifiedExecFile('bash', ['-c', command]);
      const results = createArrayFromStringWithSpace(stdout);
      const numberResult: number[] = [];
      //CPU is in millicores. We want cores so have remove m from the end and div with 1000
      await Promise.all(
        results.map((cpu) => {
          const numCPU = Number(cpu.slice(0, -1));
          const divCPU = numCPU / 1000;
          numberResult.push(divCPU);
        })
      );

      return numberResult;
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('stderr:', error.message);
      return undefined;
    }
  }

  async getDeployRequestedAndLimitRAM(
    deploy: string,
    namespace: string
  ): Promise<number[] | undefined> {
    try {
      const command = `kubectl get deploy ${deploy} -n ${namespace} -o=jsonpath='{range .spec.template.spec.containers[*]}{.resources.requests.memory}{" "}{.resources.limits.memory}{" "}{end}'`;
      const { stdout } = await promisifiedExecFile('bash', ['-c', command]);
      const results = createArrayFromStringWithSpace(stdout);
      const numberResult: number[] = [];
      //CPU is in millicores. We want cores so have remove m from the end and div with 1000
      await Promise.all(
        results.map((ram) => {
          const numRAM = Number(ram.slice(0, -2));
          const divRAM = numRAM / 1024;
          numberResult.push(divRAM);
        })
      );

      return numberResult;
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('stderr:', error.message);
      return undefined;
    }
  }

  async getDeploysNodes(
    deploy: string,
    namespace: string
  ): Promise<string | undefined> {
    try {
      const command = `kubectl get pods -n ${namespace} -o=jsonpath='{.items[?(@.metadata.labels.app=="${deploy}")].spec.nodeName}'`;
      const { stdout } = await promisifiedExecFile('bash', ['-c', command]);

      return stdout;
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('stderr:', error.message);
      return undefined;
    }
  }

  async getReplicaPodsByDeployment(
    deployment: string,
    namespace: string
  ): Promise<string[] | undefined> {
    try {
      const command = `kubectl get pods -l app=${deployment} -n ${namespace} -o json | jq -r '[.items[].metadata.name] | join(" ")'`;
      const { stdout } = await promisifiedExecFile('bash', ['-c', command]);

      const arrayPods = stdout.split(' ');

      // remove newline from last child
      arrayPods[arrayPods.length - 1] = arrayPods[arrayPods.length - 1].replace(
        /\n$/,
        ''
      );

      logger.info(arrayPods);
      return arrayPods;
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('stderr:', error.message);
      return undefined;
    }
  }

  async getPodsByService(
    service: string,
    namespace: string
  ): Promise<string[] | undefined> {
    try {
      const command = `kubectl get ep ${service} -n ${namespace} -o=jsonpath='{.subsets[*].addresses[*].ip}' | tr ' ' '\n' | xargs -I % kubectl get pods -o=name --field-selector=status.podIP=% -n ${namespace} | tr '\n' ' '`;
      const { stdout } = await promisifiedExecFile('bash', ['-c', command]);
      const arrayPods = stdout
        .trim()
        .split(' ')
        .map((pod) => pod.replace('pod/', ''));
      return arrayPods;
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('stderr:', error.message);
      return undefined;
    }
  }

  async getPodIp(namespace: string, pod: string) {
    try {
      const command = `kubectl get pod -o wide -n ${namespace} | grep -E '${pod} .*Running' | awk '{print $6}'`;
      const { stdout } = await promisifiedExecFile('bash', ['-c', command]);

      return stdout;
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('stderr:', error.message);
      return undefined;
    }
  }

  async getClusterRegion(): Promise<string | undefined> {
    try {
      const command = `kubectl get nodes -o json | jq -r '.items[0].metadata.labels["topology.kubernetes.io/region"]'`;
      const { stdout } = await promisifiedExecFile('bash', ['-c', command]);

      return stdout.replace(/\n$/, '');
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('stderr:', error.message);
      return undefined;
    }
  }

  async getRegionZoneNodeByPod(
    pod: string,
    namespace: string
  ): Promise<podLocation | undefined> {
    try {
      const command_1 = `kubectl get pod ${pod} -n ${namespace} -o=jsonpath='{.spec.nodeName}'`;
      const node = await promisifiedExecFile('bash', ['-c', command_1]);

      if (node.stdout) {
        const command_2 = `kubectl get node ${node.stdout} -o json | jq -r '.metadata.labels | to_entries[] | select(.key | test("topology.kubernetes.io/(region|zone)")) | .value'`;
        const result = await promisifiedExecFile('bash', ['-c', command_2]);
        const [region, zone] = result.stdout.trim().split('\n');

        return {
          region: region,
          zone: zone,
          node: node.stdout,
        };
      }

      return undefined;
    } catch (e: unknown) {
      const error = e as Error;
      logger.error(`stderr: ${error.message}`);
      return undefined;
    }
  }

  async getNodeByPod(
    pod: string,
    namespace: string
  ): Promise<string | undefined> {
    try {
      const command = `kubectl get pod ${pod} -n ${namespace} -o=jsonpath='{.spec.nodeName}'`;
      const { stdout } = await promisifiedExecFile('bash', ['-c', command]);
      return stdout;
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('stderr:', error.message);
      return undefined;
    }
  }

  async getExternalIpBySvc(
    svc: string,
    ns: string
  ): Promise<string | undefined> {
    try {
      const command = `kubectl get svc ${svc} -n ${ns} --output=jsonpath='{.status.loadBalancer.ingress[0].ip}'`;
      const { stdout } = await promisifiedExecFile('bash', ['-c', command]);

      return stdout;
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('stderr:', error.message);
      return undefined;
    }
  }

  async getPortBySvc(svc: string, ns: string): Promise<string | undefined> {
    try {
      const command = `kubectl get svc ${svc} -n ${ns} -o jsonpath='{.spec.ports[0].port}'`;
      const { stdout } = await promisifiedExecFile('bash', ['-c', command]);

      return stdout;
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('stderr:', error.message);
      return undefined;
    }
  }

  async createResource(yamlFile: string, ns: string): Promise<void> {
    try {
      const command = `kubectl apply -f ${yamlFile} -n ${ns}`;
      await promisifiedExecFile('bash', ['-c', command]);
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('stderr:', error.message);
      return undefined;
    }
  }

  async addLabelToPod(pod: string, namespace: string, label: string) {
    try {
      const command = `kubectl label pods ${pod} ${label} -n ${namespace} --overwrite`;
      await promisifiedExecFile('bash', ['-c', command]);
    } catch (e: unknown) {
      const error = e as Error;
      logger.error('stderr:', error.message);
    }
  }

  //SVC is the Service sudo iptables -t nat -nvL KUBE-SERVICES | grep "default/hello-aplaz" | awk '{print $3}' aplaz-578577fb77-zssmj
  async getSVC(namespace: string, service: string) {
    const command = `sudo iptables -t nat -nvL KUBE-SERVICES | grep "${namespace}/${service}" | awk '{print $3}'`;
    return command;
  }

  //sudo iptables -t nat -nvL KUBE-SVC-2V2EITAI4HSC3SPS | awk '{print $3}' | sed  '1,2d'
  async getSEP(ipTableSvc: string) {
    const command = `sudo iptables -t nat -nvL ${ipTableSvc} | awk '{print $3}' | sed  '1,2d'`;
    return command;
  }

  //sudo iptables -t nat -nvL KUBE-SEP-SVNJUGJNCVPTX3I2 | awk '{print $8}' | sed -n '3p'
  async getSEPsIP(sep: string) {
    const command = `sudo iptables -t nat -nvL ${sep} | awk '{print $8}' | sed -n '3p'`;
    return command;
  }

  async setRatio(svc: string, sep: string, ratio: number) {
    const command = `sudo iptables -t nat -I ${svc} 1 -s 0.0.0.0/0 -j ${sep} -m statistic --mode random --probability ${ratio}`;
    return command;
  }
}

const kubernetesApi = new KubernetesApi();

export default kubernetesApi;

//sudo iptables -A KUBE-SVC-2V2EITAI4HSC3SPS -m comment --comment "default/hello-aplaz" -m statistic --mode random --probability 1 -j KUBE-SEP-AB37MNUEEMA4EJ5J
//sudo iptables -t nat -R KUBE-SVC-2V2EITAI4HSC3SPS 1 -s 0.0.0.0/0 -j KUBE-SEP-AB37MNUEEMA4EJ5J -m statistic --mode random --probability 1

//sudo iptables -t nat -nvL KUBE-SERVICES | grep "default/hello-aplaz" | awk '{print $3}'
//sudo iptables -t nat -nvL KUBE-SVC-2V2EITAI4HSC3SPS | awk '{print $3}' | sed  '1,2d'

//sudo iptables -t nat -nvL KUBE-SEP-4VQUIH5RWDMWGOKL | awk '{print $8}' | sed -n '3p'    //YES 172.31.26.140
//sudo iptables -t nat -nvL KUBE-SEP-VD2HBEKDHMG4BP6W | awk '{print $8}' | sed -n '3p'    //NO
//sudo iptables -t nat -nvL KUBE-SEP-LQWJ2HKRSG3MITPI | awk '{print $8}' | sed -n '3p'    //NO
//sudo iptables -t nat -nvL KUBE-SEP-HQN72BENX4EDUFZU | awk '{print $8}' | sed -n '3p'    //NO

//sudo iptables -t nat -R KUBE-SVC-2V2EITAI4HSC3SPS 1 -s 0.0.0.0/0 -j KUBE-SEP-4VQUIH5RWDMWGOKL -m statistic --mode random --probability 1
//sudo iptables -t nat -R KUBE-SVC-2V2EITAI4HSC3SPS 2 -s 0.0.0.0/0 -j KUBE-SEP-VD2HBEKDHMG4BP6W -m statistic --mode random --probability 0
//sudo iptables -t nat -R KUBE-SVC-2V2EITAI4HSC3SPS 3 -s 0.0.0.0/0 -j KUBE-SEP-LQWJ2HKRSG3MITPI -m statistic --mode random --probability 0
//sudo iptables -t nat -R KUBE-SVC-2V2EITAI4HSC3SPS 4 -s 0.0.0.0/0 -j KUBE-SEP-HQN72BENX4EDUFZU -m statistic --mode random --probability 0

//172.31.19.208

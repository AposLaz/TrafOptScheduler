import { promisify } from "node:util";
import { execFile } from "node:child_process";
import {
  createArrayFromStringWithNewLine,
  createArrayFromStringWithSpace,
} from "../../commons/helper";
import { DeployList, DeploymentType } from "./types";

const promisifiedExecFile = promisify(execFile);

const kubernetesDefaultNamespaces = [
  "asm-system",
  "gke-mcs",
  "gmp-public",
  "gmp-system",
  "ingress-nginx",
  "istio-gateway",
  "istio-system",
  "kube-node-lease",
  "kube-public",
  "kube-system",
];

class KubernetesApi {
  //cluster: string, zone: string, project: string
  async getContextNames(): Promise<string[] | undefined> {
    //get kube configs
    try {
      const { stdout } = await promisifiedExecFile("kubectl", [
        "config",
        "get-contexts",
        "-o",
        "name",
      ]);

      const results = createArrayFromStringWithNewLine(stdout);
      return results;
    } catch (e: unknown) {
      const error = e as Error;
      console.error("stderr:", error.message);
      return undefined;
    }
  }

  async useContext(context: string) {
    try {
      const command = `kubectl config use-context ${context}`;
      await promisifiedExecFile("bash", ["-c", command]);
    } catch (e: unknown) {
      const error = e as Error;
      console.error("stderr:", error.message);
      throw new Error("[ERROR] => Switch Context from K8s API");
    }
  }

  async getAllNodesForEachContext() {
    try {
      const command = `kubectl get nodes -o=jsonpath='{.items[*].metadata.name}'`;
      const { stdout } = await promisifiedExecFile("bash", ["-c", command]);
      const results = createArrayFromStringWithSpace(stdout);
      return results;
    } catch (e: unknown) {
      const error = e as Error;
      console.error("stderr:", error.message);
      return undefined;
    }
  }

  async getAllNamespacesForDeploys(): Promise<string[] | undefined> {
    try {
      const command = `kubectl get ns -o=jsonpath='{.items[*].metadata.name}'`;
      const { stdout } = await promisifiedExecFile("bash", ["-c", command]);
      const strArray = createArrayFromStringWithSpace(stdout);
      //get only namespaces that are for deploy apps
      const results = strArray.filter(
        (strNs) => !kubernetesDefaultNamespaces.some((ns) => ns === strNs)
      );
      return results;
    } catch (e: unknown) {
      const error = e as Error;
      console.error("stderr:", error.message);
      return undefined;
    }
  }

  async getAllDeployJSONFromNamespace(
    namespace: string
  ): Promise<DeploymentType[] | undefined> {
    try {
      const command = `kubectl get deploy -n ${namespace} -o json`;
      const { stdout } = await promisifiedExecFile("bash", ["-c", command]);
      const json: DeployList = JSON.parse(stdout);

      return json.items;
    } catch (e: unknown) {
      const error = e as Error;
      console.error("stderr:", error.message);
      return undefined;
    }
  }

  async getDeploymentsFromNamespace(
    namespace: string
  ): Promise<string[] | undefined> {
    try {
      const { stdout } = await promisifiedExecFile("kubectl", [
        "get",
        "deploy",
        "-n",
        namespace,
        "-o=jsonpath={.items[*].metadata.name}",
      ]);

      const results = createArrayFromStringWithSpace(stdout);
      return results;
    } catch (e: unknown) {
      const error = e as Error;
      console.error("stderr:", error.message);
      return undefined;
    }
  }

  async getDeployRequestedAndLimitCPU(
    deploy: string,
    namespace: string
  ): Promise<number[] | undefined> {
    try {
      const command = `kubectl get deploy ${deploy} -n ${namespace} -o=jsonpath='{range .spec.template.spec.containers[*]}{.resources.requests.cpu}{" "}{.resources.limits.cpu}{" "}{end}'`;
      const { stdout } = await promisifiedExecFile("bash", ["-c", command]);
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
      console.error("stderr:", error.message);
      return undefined;
    }
  }

  async getDeployRequestedAndLimitRAM(
    deploy: string,
    namespace: string
  ): Promise<number[] | undefined> {
    try {
      const command = `kubectl get deploy ${deploy} -n ${namespace} -o=jsonpath='{range .spec.template.spec.containers[*]}{.resources.requests.memory}{" "}{.resources.limits.memory}{" "}{end}'`;
      const { stdout } = await promisifiedExecFile("bash", ["-c", command]);
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
      console.error("stderr:", error.message);
      return undefined;
    }
  }

  async getDeploysNodes(
    deploy: string,
    namespace: string
  ): Promise<string | undefined> {
    try {
      const command = `kubectl get pods -n ${namespace} -o=jsonpath='{.items[?(@.metadata.labels.app=="${deploy}")].spec.nodeName}'`;
      const { stdout } = await promisifiedExecFile("bash", ["-c", command]);

      return stdout;
    } catch (e: unknown) {
      const error = e as Error;
      console.error("stderr:", error.message);
      return undefined;
    }
  }

  async getIstioExternalIp(): Promise<string | undefined> {
    try {
      const command = `kubectl get svc -n istio-system --selector=app=istio-ingressgateway \
       --output=jsonpath='{.items[*].status.loadBalancer.ingress[0].ip}'`;
      const { stdout } = await promisifiedExecFile("bash", ["-c", command]);

      return stdout;
    } catch (e: unknown) {
      const error = e as Error;
      console.error("stderr:", error.message);
      return undefined;
    }
  }
}
const kubernetesApi = new KubernetesApi();

export default kubernetesApi;

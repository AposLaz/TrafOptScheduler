import axios from "axios";
import { Config } from "../../config/config";
import { GraphData } from "./types";
import { setupConfigs } from "../..";

class KialiApi {
  async getGraph(namespace: string) {
    const url = `http://${setupConfigs.istioIP}:${Config.KIALI_PORT}/kiali/api/namespaces/graph?duration=60s&graphType=versionedApp&includeIdleEdges=false&injectServiceNodes=true&boxBy=app&appenders=deadNode,sidecarsCheck,serviceEntry,istio&rateGrpc=requests&rateHttp=requests&rateTcp=sent&namespaces=${namespace}`;

    try {
      const response = await axios.get<GraphData>(url);
      return response.data;
    } catch (e: unknown) {
      const error = e as Error;
      console.error("axiosErr:", error);
      return undefined;
    }
  }
}

const kialiApi = new KialiApi();

export default kialiApi;

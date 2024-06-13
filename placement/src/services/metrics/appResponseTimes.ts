import kialiApi from '../../api/kiali/kialiApi';
import { GraphData } from '../../api/kiali/types';
import { FormattedEdge } from './types';

export const appResponseTimes = async () => {
  // Sample JSON data
  const rawData: GraphData = await kialiApi.getGraphMetrics(
    '10.103.220.136:20001',
    'online-boutique'
  );

  if (!rawData) return;

  const nodeMap = new Map<string, string>();
  rawData.elements.nodes.forEach((node) => {
    nodeMap.set(node.data.id, node.data.workload);
  });

  const formattedEdges: FormattedEdge[] = rawData.elements.edges.map((edge) => {
    const sourceName = nodeMap.get(edge.data.source) || 'unknown';
    const targetName = nodeMap.get(edge.data.target) || 'unknown';

    const formattedEdge: FormattedEdge = {
      source: sourceName,
      target: targetName,
      responseTime: edge.data.responseTime,
      protocol: edge.data.traffic.protocol,
    };
    console.log(edge.data.traffic.rates);
    if (edge.data.traffic.rates.tcp) {
      formattedEdge.rps = edge.data.traffic.rates.tcp;
    }

    if (edge.data.traffic.rates.grpc) {
      formattedEdge.rps = edge.data.traffic.rates.grpc;
    }

    if (edge.data.traffic.rates.http) {
      formattedEdge.rps = edge.data.traffic.rates.http;
    }

    if (edge.data.traffic.rates.https) {
      formattedEdge.rps = edge.data.traffic.rates.https;
    }

    return formattedEdge;
  });

  // Log the formatted edges to verify
  console.log(formattedEdges);
};

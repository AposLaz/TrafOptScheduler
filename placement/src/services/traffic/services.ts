import { GraphData, GraphEdges } from '../../api/kiali/types';

export const createLinksForSourceAndTarget = (
  graph: GraphData,
  namespace: string
): GraphEdges[] => {
  //get services for nodes
  const graphNodesServices = graph.elements.nodes
    .filter(
      (node) =>
        node.data.nodeType === 'service' && node.data.namespace === namespace
    )
    .map((node) => ({
      app: node.data.service,
      namespace: node.data.namespace,
      appId: node.data.id,
    }));

  const graphNodesApps = graph.elements.nodes
    .filter(
      (node) =>
        node.data.nodeType === 'workload' && node.data.namespace === namespace
    )
    .map((node) => ({
      app: node.data.app,
      namespace: node.data.namespace,
      appId: node.data.id,
    }));

  const graphEdges = graph.elements.edges.map((edge) => ({
    source:
      graphNodesServices.find((service) => service.appId === edge.data.source)
        ?.app ||
      graphNodesApps.find((app) => app.appId === edge.data.source)?.app,
    target:
      graphNodesServices.find((service) => service.appId === edge.data.target)
        ?.app ||
      graphNodesApps.find((app) => app.appId === edge.data.target)?.app,
    namespace: namespace,
  }));

  return graphEdges;
};

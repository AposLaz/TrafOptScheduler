import { GraphData } from "./types";

export const createLinksForSourceAndTarget = async (
  graph: GraphData,
  namespace: string
) => {
  //get services for nodes
  const graphNodes = graph.elements.nodes
    .filter(
      (node) =>
        node.data.nodeType === "app" && node.data.namespace === namespace
    )
    .map((node) => {
      return {
        app: node.data.app,
        namespace: node.data.namespace,
        appId: node.data.id,
      };
    });

  const dataGraph = [];

  for await (const edge of graph.elements.edges) {
    const source = graphNodes.find((app) => app.appId === edge.data.source);

    if (source) {
      dataGraph.push({
        source: source.app,
        namespaceSource: source.namespace,
        target: edge.data.target,
      });
    }

    //const target = graphNodes.find((app) => app.appId === edge.data.target);
  }

  for await (const edge of graph.elements.edges) {
    const target = graphNodes.find((app) => app.appId === edge.data.target);
  }
  console.log(dataGraph);
};

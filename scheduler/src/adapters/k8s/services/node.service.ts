import type * as k8s from '@kubernetes/client-node';

export class NodeService {
  private client: k8s.CoreV1Api;

  constructor(client: k8s.CoreV1Api) {
    this.client = client;
  }

  // get Nodes
  async getNodes() {
    const res = await this.client.listNode();
    return res.body.items;
  }

  async addLabels(nodeName: string, labels: { [key: string]: string }) {
    const node = await this.client.readNode(nodeName);
    node.body.metadata!.labels = {
      ...node.body.metadata!.labels,
      ...labels,
    };
    return this.client.replaceNode(nodeName, node.body);
  }

  // apply taints to nodes
  async addTaint(nodeNames: string[], newTaint: k8s.V1Taint) {
    for (const nodeName of nodeNames) {
      // get all nodes and apply the taints
      const node = await this.client.readNode(nodeName);

      const taintsExists = node.body.spec?.taints;

      let concatTaints = [newTaint];

      if (taintsExists) {
        // check if exist taints with different key
        const taintsDiff = taintsExists.filter((taint) => newTaint.key !== taint.key);

        // if other taints exists let them
        if (taintsDiff.length > 0) concatTaints = [newTaint, ...taintsDiff];
      }

      node.body.spec!.taints = concatTaints;
      // apply taints for the node
      await this.client.replaceNode(nodeName, node.body);
    }
  }

  // delete taints with specific key from all nodes
  async removeTaint(nodeNames: string[], taintKey: string) {
    for (const nodeName of nodeNames) {
      // set up k8s api
      const node = await this.client.readNode(nodeName);

      const taintsExists = node.body.spec?.taints;
      if (taintsExists) {
        // check if exists taints with different key and get them
        const taintsDiff = taintsExists.filter((taint) => taintKey !== taint.key);

        // if other taints exists let them and remove taints with key = taintKey
        node.body.spec!.taints = taintsDiff.length > 0 ? taintsDiff : undefined;

        // remove taints
        await this.client.replaceNode(nodeName, node.body);
      }
    }
  }
}

import type * as k8s from '@kubernetes/client-node';

// apply taints to nodes
export const addTaint = async (
  k8sClient: k8s.CoreV1Api,
  nodeNames: string[],
  newTaint: k8s.V1Taint
) => {
  for (const nodeName of nodeNames) {
    // set up k8s api
    const node = await k8sClient.readNode(nodeName);

    const taintsExists = node.body.spec?.taints;

    let concatTaints = [newTaint];

    if (taintsExists) {
      // check if exist taints with different key
      const taintsDiff = taintsExists.filter(
        (taint) => newTaint.key !== taint.key
      );

      // if other taints exists let them
      if (taintsDiff.length > 0) concatTaints = [newTaint, ...taintsDiff];
    }

    node.body.spec!.taints = concatTaints;
    // apply taints for the node
    await k8sClient.replaceNode(nodeName, node.body);
  }
};

// delete taints with specific key from all nodes
export const deleteTaint = async (
  k8sClient: k8s.CoreV1Api,
  nodeNames: string[],
  taintKey: string
) => {
  for (const nodeName of nodeNames) {
    // set up k8s api
    const node = await k8sClient.readNode(nodeName);

    const taintsExists = node.body.spec?.taints;
    if (taintsExists) {
      // check if exists taints with different key and get them
      const taintsDiff = taintsExists.filter((taint) => taintKey !== taint.key);

      // if other taints exists let them and remove taints with key = taintKey
      node.body.spec!.taints = taintsDiff.length > 0 ? taintsDiff : undefined;

      // remove taints
      await k8sClient.replaceNode(nodeName, node.body);
    }
  }
};

import * as k8s from '@kubernetes/client-node';

// apply taints to nodes
export const addTaint = async (
  k8sClient: k8s.CoreV1Api,
  nodeName: string,
  newTaint: k8s.V1Taint
) => {
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
};

// delete taints with specific key from all nodes
export const deleteTaint = async (
  k8sClient: k8s.CoreV1Api,
  taintKey: string
) => {
  const nodes = await k8sClient.listNode();

  for (const node of nodes.body.items) {
    if (node.spec?.taints) {
      // check if exists taints with different key and get them
      const taintsDiff = node.spec.taints.filter(
        (taint) => taintKey !== taint.key
      );

      // if other taints exists let them and remove taints with key = taintKey
      node.spec.taints = taintsDiff.length > 0 ? taintsDiff : undefined;

      // remove taints
      await k8sClient.replaceNode(node.metadata!.name!, node);
    }
  }
};

import * as k8s from '@kubernetes/client-node';

// apply taints to nodes
export const addTaints = async (
  k8sClient: k8s.CoreV1Api,
  nodeName: string,
  newTaints: k8s.V1Taint[]
) => {
  // set up k8s api
  const node = await k8sClient.readNode(nodeName);

  const taintsExists = node.body.spec?.taints;

  let concatTaints = newTaints;

  if (taintsExists) {
    // check if exist taints with different key
    const taintsDiff = taintsExists.filter(
      (taint) => !newTaints.some((newTaint) => newTaint.key === taint.key)
    );

    // if other taints exists let them
    if (taintsDiff.length > 0) concatTaints = [...newTaints, ...taintsDiff];
  }

  node.body.spec!.taints = concatTaints;
  // apply taints for the node
  await k8sClient.replaceNode(nodeName, node.body);
};

// delete taints with specific key from all nodes
export const deleteTaints = async (
  k8sClient: k8s.CoreV1Api,
  taintKey: string[]
) => {
  const nodes = await k8sClient.listNode();

  for (const node of nodes.body.items) {
    if (node.spec?.taints) {
      // check if exists taints with different key and get them
      const taintsDiff = node.spec.taints.filter(
        (taint) => !taintKey.some((key) => key === taint.key)
      );

      // if other taints exists let them and remove taints with key = taintKey
      node.spec.taints = taintsDiff.length > 0 ? taintsDiff : undefined;

      // remove taints
      await k8sClient.replaceNode(node.metadata!.name!, node);
    }
  }
};

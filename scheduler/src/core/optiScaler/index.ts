import { ScaleAction } from './enums';
import { OptiScalerMapper } from './mappers';
import { FaultTolerance } from './services/faultTolerance.service';
import { calculateWeights } from './utils';

import type {
  FaultToleranceType,
  OptiScalerHandlers,
  OptiScalerType,
} from './types';
import type { KubernetesAdapterImpl } from '../../adapters/k8s';
import type { PrometheusAdapterImpl } from '../../adapters/prometheus';
import type { GraphDataRps } from '../../adapters/prometheus/types';
import type { FileSystemHandler } from '../../fileSystem';

export class OptiScaler {
  private scaleAction: ScaleAction;
  private optiData: OptiScalerType;
  private ft: FaultTolerance;
  private prom: PrometheusAdapterImpl;
  private k8s: KubernetesAdapterImpl;
  private fileSystem: FileSystemHandler;

  constructor(
    action: ScaleAction,
    data: OptiScalerType,
    handles: OptiScalerHandlers
  ) {
    this.optiData = data;
    this.scaleAction = action;
    const ftData = this.optiData as FaultToleranceType;
    this.ft = new FaultTolerance(ftData);
    this.prom = handles.prom;
    this.k8s = handles.k8s;
    this.fileSystem = handles.fileSystem;
  }

  async Execute() {
    // apply the fault tolerance rules
    const ftNodes = this.getFaultToleranceNodes();
    // get the candidate node
    if (ftNodes.length === 0) return;

    if (this.scaleAction === ScaleAction.UP) {
      // get the candidate node by Um and Dm
      const cNode = await this.getCandidateNodeByGraph(ftNodes);

      const taintNodes = Object.values(this.optiData.zonesNodes).flatMap(
        (n) => {
          const nodes = n.nodes.filter((node) => node !== cNode);
          return nodes;
        }
      );

      await this.k8s.createReplicaPodToSpecificNode(
        this.optiData.deployment,
        this.optiData.namespace,
        taintNodes
      );

      const writeData = {
        deployment: this.optiData.deployment,
        namespace: this.optiData.namespace,
        node: cNode,
      };
      this.fileSystem.appendData(writeData);
    }

    if (this.scaleAction === ScaleAction.DOWN) {
      const cNode = ftNodes[0];

      const deleteNode = this.optiData.replicaPods.filter(
        (node) => node.node === cNode
      );

      const deletePod = deleteNode[Math.random() * deleteNode.length].pod;

      await this.k8s.removeReplicaPodToSpecificNode(
        this.optiData.deployment,
        deletePod,
        this.optiData.namespace
      );
      const writeData = {
        deployment: this.optiData.deployment,
        namespace: this.optiData.namespace,
        node: cNode,
      };

      this.fileSystem.appendData(writeData);
    }
  }

  async getCandidateNodeByGraph(ftNodes: string[]) {
    const upstream = await this.prom.getUpstreamPodGraph(
      this.optiData.deployment,
      this.optiData.namespace
    );

    const downstream = await this.prom.getDownstreamPodGraph(
      this.optiData.deployment,
      this.optiData.namespace
    );

    let cNode = ftNodes[(Math.random() * ftNodes.length) | 0];

    if (upstream && upstream.length > 0) {
      cNode = this.getCandidateNodeByUm(upstream, ftNodes);
    }

    if (downstream && downstream.length > 0) {
      cNode = this.getCandidateNodeByDm(downstream, ftNodes);
    }

    cNode = this.getCandidateNodeByLFU(ftNodes);

    return cNode;
  }

  getCandidateNodeByLFU(nodes: string[]) {
    const ftNodes = this.optiData.nodeMetrics.filter((node) =>
      nodes.some((n) => n === node.name)
    );

    const nodeLFU = OptiScalerMapper.toLFUNodes(ftNodes);
    return nodeLFU[0].name;
  }

  getCandidateNodeByUm(upstream: GraphDataRps[], ftNodes: string[]) {
    // check if the upstream rs pods nodes is candidate node
    const upstreamNodes = upstream.filter((node) =>
      ftNodes.includes(node.node)
    );

    // if do not be candidate node then choose the cNode by LFU
    if (upstreamNodes.length === 0) {
      return this.getCandidateNodeByLFU(ftNodes);
    }

    const nodesLatency = ftNodes.map((node) => {
      // Find the latency where the upstream node sends traffic to this node
      const latency = this.optiData.nodesLatency.find(
        (n) => n.to === node && upstreamNodes.some((um) => um.node === n.from)
      );
      // the node send traffic to itself, so the latency is zero
      if (!latency) {
        // Get an upstream node that is sending traffic
        const upstreamNode = upstreamNodes.find((um) =>
          this.optiData.nodesLatency.some(
            (n) => n.from === um.node && n.to === node
          )
        );

        return {
          from: upstreamNode ? upstreamNode.node : node, // Avoid undefined values
          to: node,
          latency: 0,
        };
      }
      return latency;
    });

    const weights = calculateWeights(upstreamNodes, ftNodes, nodesLatency);

    const sortByLowestWeight = weights.sort((a, b) => a.weight - b.weight);

    // return the node with the lowest weight
    return sortByLowestWeight[0].to;
  }

  getCandidateNodeByDm(downstream: GraphDataRps[], ftNodes: string[]) {
    // check if the downstream rs pods nodes is candidate node
    const dmNodes = downstream.filter((node) => ftNodes.includes(node.node));

    // if do not be candidate node then choose the cNode by LFU
    if (dmNodes.length === 0) {
      return this.getCandidateNodeByLFU(ftNodes);
    }

    const nodesLatency = ftNodes.map((node) => {
      // Find the latency where the upstream node sends traffic to this node
      const latency = this.optiData.nodesLatency.find(
        (n) => n.from === node && dmNodes.some((dm) => dm.node === n.to)
      );
      // the node send traffic to itself, so the latency is zero
      if (!latency) {
        // Get an upstream node that is sending traffic
        const dmNode = dmNodes.find((dm) =>
          this.optiData.nodesLatency.some(
            (n) => n.to === dm.node && n.from === node
          )
        );

        return {
          from: node,
          to: dmNode ? dmNode.node : node, // Avoid undefined values
          latency: 0,
        };
      }
      return latency;
    });

    console.log(nodesLatency);

    const weights = calculateWeights(dmNodes, ftNodes, nodesLatency);

    const sortByLowestWeight = weights.sort((a, b) => a.weight - b.weight);

    // return the node with the lowest weight
    return sortByLowestWeight[0].from;
  }

  getFaultToleranceNodes() {
    if (this.scaleAction === ScaleAction.UP) {
      return this.ft.getCandidateNodesToAdd();
    } else {
      return this.ft.getCandidateNodeToRemove();
    }
  }
}

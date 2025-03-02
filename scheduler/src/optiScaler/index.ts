import { ScaleAction } from './enums';
import { OptiScalerMapper } from './mappers';
import { FaultTolerance } from './services/faultTolerance.service';
import { calculateWeights } from './utils';

import type { FaultToleranceType, OptiScalerType } from './types';
import type { PrometheusManager } from '../prometheus/manager';
import type { GraphDataRps } from '../prometheus/types';

export class OptiScaler {
  private scaleAction: ScaleAction;
  private optiData: OptiScalerType;
  private ft: FaultTolerance;
  private prometheus: PrometheusManager;

  constructor(
    action: ScaleAction,
    data: OptiScalerType,
    prometheus: PrometheusManager
  ) {
    this.optiData = data;
    this.scaleAction = action;
    const ftData = this.optiData as FaultToleranceType;
    this.ft = new FaultTolerance(ftData);
    this.prometheus = prometheus;
  }

  async Execute() {
    // apply the fault tolerance rules
    const ftNodes = this.getCandidateNodes();
    console.log(ftNodes);

    const upstream = await this.prometheus.getUpstreamPodGraph(
      this.optiData.deployment,
      this.optiData.namespace
    );

    const downstream = await this.prometheus.getDownstreamPodGraph(
      this.optiData.deployment,
      this.optiData.namespace
    );

    if (upstream && upstream.length > 0) {
      return this.getCandidateNodeByUm(upstream, ftNodes);
    }

    if (downstream && downstream.length > 0) {
      console.log(JSON.stringify(downstream, null, 2)); // prettier-ignore upstream);

      return this.getCandidateNodeByDm(downstream, ftNodes);
    }

    return this.getCandidateNodeByLFU(ftNodes);
  }

  getCandidateNodes() {
    if (this.scaleAction === ScaleAction.UP) {
      return this.ft.getCandidateNodesToAdd();
    } else {
      return this.ft.getCandidateNodeToRemove();
    }
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
}

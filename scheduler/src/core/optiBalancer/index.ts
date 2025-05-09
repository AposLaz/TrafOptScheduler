import { OptiBalancerMapper } from './mapper.js';
import { logger } from '../../config/logger.js';
import { MetricsType } from '../../enums.js';

import type {
  DestinationRule,
  DistributedPercentTraffic,
  NormalizedTraffic,
  OptiScalerType,
  TrafficWeights,
} from './types';
import type { KubernetesAdapterImpl } from '../../adapters/k8s/index.js';
import type { PodMetrics } from '../../adapters/k8s/types';
import type { PrometheusAdapterImpl } from '../../adapters/prometheus/index.js';
import type { GraphDataRps, NodesLatency } from '../../adapters/prometheus/types';

export class OptiBalancer {
  private readonly k8s: KubernetesAdapterImpl;
  private readonly prom: PrometheusAdapterImpl;
  private readonly metricType: MetricsType;
  private readonly loggerOperation = logger.child({ operation: 'OptiBalancer' });

  constructor(k8s: KubernetesAdapterImpl, prometheus: PrometheusAdapterImpl, metricType: MetricsType) {
    this.k8s = k8s;
    this.prom = prometheus;
    this.metricType = metricType;
  }

  async Execute(data: OptiScalerType) {
    const upstream = await this.prom.getUpstreamPodGraph(data.deployment, data.namespace);
    if (upstream && upstream.length > 0) {
      this.loggerOperation.info(`Initialize traffic distribution rules`, {
        deployment: data.deployment,
        namespace: data.namespace,
      });

      const traffic = this.calculateTraffic(data, upstream);
      const createDestinationRule = OptiBalancerMapper.toDestinationRule(
        traffic,
        data.namespace,
        data.deployment,
        data.clusterTopology
      );

      await this.applyTrafficRules(createDestinationRule);
    }
  }

  private async applyTrafficRules(createDestinationRule: DestinationRule) {
    await this.k8s.applyCustomResource(createDestinationRule);
  }

  private calculateTraffic(data: OptiScalerType, upstream: GraphDataRps[]) {
    const podsPerNode = this.groupPodsByNode(data.replicaPods);
    const uniqueNodes = Array.from(podsPerNode.keys());

    const totalReplicas = data.replicaPods.length;
    const totalLoad = this.totalLoad(data.replicaPods, this.metricType);
    const totalLatency = uniqueNodes.reduce((acc, n) => acc + this.totalLatency(upstream, n, data.nodesLatency), 0);

    console.log('total latency', totalLatency);
    console.log('total load', totalLoad);
    console.log('total replicas', totalReplicas);

    const weights: TrafficWeights[] = [];

    for (const node of uniqueNodes) {
      const nodesLatency = this.perNodeLatency(upstream, node, data.nodesLatency);
      console.log('nodes latency', nodesLatency);
      const podsWithinNode = podsPerNode.get(node)!;
      const normalizedPodsLength = podsWithinNode.length / totalReplicas;

      const nodeLoad = this.totalLoad(podsWithinNode, this.metricType);
      const loadRatio = isNaN(nodeLoad / totalLoad) || nodeLoad / totalLoad >= 1 ? 1 : nodeLoad / totalLoad;
      const normalizedLoad = Math.min(0.9, loadRatio);

      for (const nl of nodesLatency) {
        const latencyRatio =
          isNaN(nl.latency / totalLatency) || nl.latency / totalLatency < 0 ? 0 : nl.latency / totalLatency;
        const normalizedLatency = Math.min(0.9, latencyRatio);

        const weight = (1 - normalizedLatency) * normalizedPodsLength * (1 - normalizedLoad);

        weights.push({
          from: nl.from,
          to: nl.to,
          weight,
        });
      }
    }

    console.log('weights', weights);

    const totalWeights = weights.reduce((acc, n) => acc + n.weight, 0);

    console.log('total weights', totalWeights);
    // Compute Traffic Distribution
    const trafficDistribution = weights.map((w) => ({
      from: w.from,
      to: w.to,
      rawTraffic: Math.max(0.1, w.weight / totalWeights), // Ensure minimum 0.1
    }));

    console.log('traffic distribution', trafficDistribution);

    // Normalize Traffic Distribution
    const totalTraffic = trafficDistribution.reduce((acc, t) => acc + t.rawTraffic, 0);

    console.log('total traffic', totalTraffic);
    const normalizedTraffic: NormalizedTraffic[] = trafficDistribution.map((t) => ({
      from: t.from,
      to: t.to,
      normalizedTraffic: t.rawTraffic / totalTraffic, // Normalize to sum up to 1
    }));

    console.log('normalized traffic', normalizedTraffic);

    const finalTrafficDistribution = this.convertTrafficDistributionToPercentages(normalizedTraffic);
    console.log('final traffic distribution', finalTrafficDistribution);

    return finalTrafficDistribution;
  }

  private convertTrafficDistributionToPercentages(normalizedTraffic: NormalizedTraffic[]): DistributedPercentTraffic[] {
    // Step 1: Group traffic by `from` node
    const groupedTraffic = new Map<string, { to: string; rawTraffic: number }[]>();

    for (const t of normalizedTraffic) {
      if (!groupedTraffic.has(t.from)) {
        groupedTraffic.set(t.from, []);
      }
      groupedTraffic.get(t.from)!.push({ to: t.to, rawTraffic: t.normalizedTraffic });
    }

    // Step 2: Normalize per `from` node to ensure each sums to 100
    const finalTrafficDistribution: DistributedPercentTraffic[] = [];

    for (const [from, toList] of groupedTraffic.entries()) {
      // Normalize raw traffic so that the sum is exactly 1 (100%)
      const totalRawTraffic = toList.reduce((acc, t) => acc + t.rawTraffic, 0);

      let trafficAsPercentage = toList.map((t) => ({
        from,
        to: t.to,
        percentage: Math.floor((t.rawTraffic / totalRawTraffic) * 100), // Convert to percentage and round down
        fraction: ((t.rawTraffic / totalRawTraffic) * 100) % 1, // Store the fraction part for later adjustment
      }));

      // Ensure the total percentage for this `from` node is exactly 100
      let totalPercentage = trafficAsPercentage.reduce((acc, t) => acc + t.percentage, 0);
      const deficit = 100 - totalPercentage; // Remaining percentage points to distribute

      // Distribute missing points to the highest fraction values
      trafficAsPercentage
        .toSorted((a, b) => b.fraction - a.fraction) // Sort by highest fraction first
        .slice(0, deficit) // Pick the top 'deficit' items
        .forEach((t) => t.percentage++); // Increment by 1

      // Remove fraction field and add to final list
      finalTrafficDistribution.push(
        ...trafficAsPercentage.map(({ from, to, percentage }) => ({ from, to, percentage }))
      );
    }

    return finalTrafficDistribution;
  }

  private totalLoad(rs: PodMetrics[], metric: MetricsType) {
    switch (metric) {
      case MetricsType.CPU:
        return rs.reduce((acc, n) => acc + n.percentUsage.cpu, 0);
      case MetricsType.CPU_MEMORY:
        return rs.reduce((acc, n) => acc + n.percentUsage.cpu + n.percentUsage.memory, 0);
      default:
        return rs.reduce((acc, n) => acc + n.percentUsage.memory, 0);
    }
  }

  private totalLatency(graph: GraphDataRps[], dNode: string, nodesLatency: NodesLatency[]) {
    const latencyTo = nodesLatency.filter((n) => n.to === dNode);

    const latencyFromTo = latencyTo.filter((node) => graph.some((n) => n.node === node.from));

    console.log('totalLatency', latencyFromTo);

    return latencyFromTo.reduce((acc, n) => acc + n.latency, 0);
  }

  private perNodeLatency(graph: GraphDataRps[], dNode: string, nodesLatency: NodesLatency[]) {
    const latencyTo = nodesLatency.filter((n) => n.to === dNode);

    const latencyFromTo = latencyTo.filter((node) => graph.some((n) => n.node === node.from));

    return latencyFromTo;
  }

  private groupPodsByNode(rs: PodMetrics[]) {
    // Create a Map where the key is the node, and the value is an array of pods
    const nodeMap = new Map<string, PodMetrics[]>();

    for (const pod of rs) {
      if (!nodeMap.has(pod.node)) {
        nodeMap.set(pod.node, []);
      }
      nodeMap.get(pod.node)!.push(pod);
    }

    return nodeMap;
  }
}

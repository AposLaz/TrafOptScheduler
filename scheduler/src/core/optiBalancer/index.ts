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
import type { DeploymentResponseTime, GraphDataRps, NodesLatency } from '../../adapters/prometheus/types';
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

      //const perNodeResponseTime = await this.prom.getResponseTimeByNodeDeployment(data.deployment, data.namespace);
      const traffic = this.calculateTraffic(data, upstream);
      //const traffic = this.optTraffic(data, upstream);
      // console.log(JSON.stringify(traffic, null, 2));
      // get the desployment service name
      const serviceName = upstream[0].destinations[0].destination_service_name;
      const createDestinationRule = OptiBalancerMapper.toDestinationRule(
        traffic,
        data.namespace,
        serviceName,
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

    const totalLoad = this.totalLoad(data.replicaPods, this.metricType) / totalReplicas;
    const totalLatency = uniqueNodes.reduce((acc, n) => acc + this.totalLatency(upstream, n, data.nodesLatency), 0);
    let totalResponseTime = 0;

    console.log('total latency', totalLatency);
    console.log('total load', totalLoad);
    console.log('total replicas', totalReplicas);
    console.log('total response time', totalResponseTime);

    const weights: TrafficWeights[] = [];

    for (const node of uniqueNodes) {
      const nodesLatency = this.perNodeLatency(upstream, node, data.nodesLatency);
      console.log('nodes latency', nodesLatency);
      const podsWithinNode = podsPerNode.get(node)!;

      const nodeLoad = this.totalLoad(podsWithinNode, this.metricType) / podsWithinNode.length;
      const loadRatio = isNaN(nodeLoad / totalLoad) || nodeLoad / totalLoad >= 1 ? 1 : nodeLoad / totalLoad;
      const normalizedLoad = Math.min(0.9, loadRatio);

      for (const nl of nodesLatency) {
        const normalizedPodsLength = podsWithinNode.length / totalReplicas;
        console.log('from-to', nl.from, nl.to);
        const latencyRatio =
          isNaN(nl.latency / totalLatency) || nl.latency / totalLatency < 0 ? 0 : nl.latency / totalLatency;
        const normalizedLatency = Math.min(0.9, latencyRatio);

        console.log('normalized pods length', normalizedPodsLength);

        const weight = (1 - normalizedLatency) * normalizedPodsLength * (1 - normalizedLoad); // * * normalizedPodsLength *
        // cpu , latency, cpu & latency, cpu & latency & pod, optTraffic,
        weights.push({
          from: nl.from,
          to: nl.to,
          weight,
        });
      }
    }

    console.log('weights', weights);

    const totalWeights = weights.reduce((acc, n) => acc + n.weight, 0);

    // console.log('total weights', totalWeights);
    // Compute Traffic Distribution
    const trafficDistribution = weights.map((w) => ({
      from: w.from,
      to: w.to,
      rawTraffic: Math.max(0.1, w.weight / totalWeights), // Ensure minimum 0.1
    }));

    // console.log('traffic distribution', trafficDistribution);

    // Normalize Traffic Distribution
    const totalTraffic = trafficDistribution.reduce((acc, t) => acc + t.rawTraffic, 0);

    // console.log('total traffic', totalTraffic);
    const normalizedTraffic: NormalizedTraffic[] = trafficDistribution.map((t) => ({
      from: t.from,
      to: t.to,
      normalizedTraffic: t.rawTraffic / totalTraffic, // Normalize to sum up to 1
    }));

    // console.log('normalized traffic', normalizedTraffic);

    const finalTrafficDistribution = this.convertTrafficDistributionToPercentages(normalizedTraffic);
    console.log('final traffic distribution', finalTrafficDistribution);

    return finalTrafficDistribution;
  }

  private calculateTrafficResponseTime(
    data: OptiScalerType,
    upstream: GraphDataRps[],
    perNodeResponseTime: DeploymentResponseTime[] | undefined
  ) {
    const podsPerNode = this.groupPodsByNode(data.replicaPods);
    const uniqueNodes = Array.from(podsPerNode.keys());

    const totalReplicas = data.replicaPods.length;

    const totalLatency = uniqueNodes.reduce((acc, n) => acc + this.totalLatency(upstream, n, data.nodesLatency), 0);
    let totalResponseTime = 0;

    if (perNodeResponseTime) {
      totalResponseTime = perNodeResponseTime.reduce((acc, n) => acc + n.responseTime, 0);
    }

    console.log('total latency', totalLatency);
    console.log('total replicas', totalReplicas);
    console.log('total response time', totalResponseTime);

    const weights: TrafficWeights[] = [];

    for (const node of uniqueNodes) {
      const nodesLatency = this.perNodeLatency(upstream, node, data.nodesLatency);
      console.log('nodes latency', nodesLatency);
      const podsWithinNode = podsPerNode.get(node)!;

      for (const nl of nodesLatency) {
        const normalizedPodsLength = podsWithinNode.length / totalReplicas;
        console.log('from-to', nl.from, nl.to);
        const latencyRatio =
          isNaN(nl.latency / totalLatency) || nl.latency / totalLatency < 0 ? 0 : nl.latency / totalLatency;
        const normalizedLatency = Math.min(0.9, latencyRatio);

        const respTime = perNodeResponseTime?.find((r) => r.node === nl.to)?.responseTime ?? 0;
        const normalizedResponseTime =
          isNaN(respTime / totalResponseTime) || respTime < 0 ? 0 : respTime / totalResponseTime;

        console.log('normalized pods length', normalizedPodsLength);

        const weight = (1 - normalizedLatency) * normalizedPodsLength * (1 - normalizedResponseTime); // * * normalizedPodsLength *
        // cpu , latency, cpu & latency, cpu & latency & pod, optTraffic,
        weights.push({
          from: nl.from,
          to: nl.to,
          weight,
        });
      }
    }

    console.log('weights', weights);

    const totalWeights = weights.reduce((acc, n) => acc + n.weight, 0);

    // console.log('total weights', totalWeights);
    // Compute Traffic Distribution
    const trafficDistribution = weights.map((w) => ({
      from: w.from,
      to: w.to,
      rawTraffic: Math.max(0.1, w.weight / totalWeights), // Ensure minimum 0.1
    }));

    // console.log('traffic distribution', trafficDistribution);

    // Normalize Traffic Distribution
    const totalTraffic = trafficDistribution.reduce((acc, t) => acc + t.rawTraffic, 0);

    // console.log('total traffic', totalTraffic);
    const normalizedTraffic: NormalizedTraffic[] = trafficDistribution.map((t) => ({
      from: t.from,
      to: t.to,
      normalizedTraffic: t.rawTraffic / totalTraffic, // Normalize to sum up to 1
    }));

    // console.log('normalized traffic', normalizedTraffic);

    const finalTrafficDistribution = this.convertTrafficDistributionToPercentages(normalizedTraffic);
    console.log('final traffic distribution', finalTrafficDistribution);

    return finalTrafficDistribution;
  }
  private calculateTrafficUm(
    data: OptiScalerType,
    upstream: GraphDataRps[],
    perNodeResponseTime: DeploymentResponseTime[] | undefined
  ) {
    const podsPerNode = this.groupPodsByNode(data.replicaPods);
    const uniqueNodes = Array.from(podsPerNode.keys());

    const totalReplicas = data.replicaPods.length || 1;
    const totalUpstream = upstream.map((n) => n.destinations.length).reduce((acc, n) => acc + n, 0);
    console.log('total upstream', totalUpstream);
    const totalNeed = totalUpstream / totalReplicas;

    const totalLoad = this.totalLoad(data.replicaPods, this.metricType) / totalReplicas;
    const totalLatency = uniqueNodes.reduce((acc, n) => acc + this.totalLatency(upstream, n, data.nodesLatency), 0);
    let totalResponseTime = 0;

    if (perNodeResponseTime) {
      totalResponseTime = perNodeResponseTime.reduce((acc, n) => acc + n.responseTime, 0);
    }

    console.log('total latency', totalLatency);
    console.log('total load', totalLoad);
    console.log('total replicas', totalReplicas);
    console.log('total response time', totalResponseTime);

    const weights: TrafficWeights[] = [];

    for (const node of uniqueNodes) {
      const nodesLatency = this.perNodeLatency(upstream, node, data.nodesLatency);
      console.log('nodes latency', nodesLatency);
      const podsWithinNode = podsPerNode.get(node)!;

      const nodeLoad = this.totalLoad(podsWithinNode, this.metricType) / podsWithinNode.length;
      const loadRatio = isNaN(nodeLoad / totalLoad) || nodeLoad / totalLoad >= 1 ? 1 : nodeLoad / totalLoad;

      const MAX_LOAD_NORMALIZATION = 0.9;

      const normalizedLoad = Math.min(MAX_LOAD_NORMALIZATION, loadRatio);

      for (const nl of nodesLatency) {
        console.log('from-to', nl.from, nl.to);
        const latencyRatio =
          isNaN(nl.latency / totalLatency) || nl.latency / totalLatency < 0 ? 0 : nl.latency / totalLatency;
        const normalizedLatency = Math.min(0.9, latencyRatio);

        console.log('pods within node', podsWithinNode.length);
        const umWithinNodeFilter = upstream.filter((n) => n.node === nl.from);
        const umWithinNode = umWithinNodeFilter.length > 0 ? umWithinNodeFilter[0].destinations.length : 0;
        console.log('um within node', umWithinNode);
        const localNeed = umWithinNode / podsWithinNode.length;
        console.log('local need', localNeed);
        const normalizedPodsLength =
          isNaN(localNeed / totalNeed) || localNeed / totalNeed >= 1 ? 1 : localNeed / totalNeed;

        console.log('normalized pods length', normalizedPodsLength);
        // Combine response time + latency into one metric
        // const combinedLatency =
        //   normalizedResponseTime === 0 ? normalizedLatency : 0.5 * normalizedLatency + 0.5 * normalizedResponseTime;
        const INTER_NODE_PENALTY = 0.8;

        const ALPHA = 0.7; // importance of latency
        const BETA = 1 - ALPHA; // importance of load

        let weight = (1 - normalizedLatency) ** ALPHA * normalizedPodsLength * (1 - normalizedLoad) ** BETA;

        if (nl.from !== node) {
          weight *= INTER_NODE_PENALTY; // Apply penalty instead of changing formula structure
        }
        // const weight = (1 - normalizedLatency) * normalizedPodsLength * (1 - normalizedLoad); // * * normalizedPodsLength *
        // cpu , latency, cpu & latency, cpu & latency & pod, optTraffic,
        weights.push({
          from: nl.from,
          to: nl.to,
          weight,
        });
      }
    }

    console.log('weights', weights);

    const totalWeights = weights.reduce((acc, n) => acc + n.weight, 0);

    // console.log('total weights', totalWeights);
    // Compute Traffic Distribution
    const MIN_TRAFFIC_RATIO = 0.01; // or make this a constructor/config param

    const trafficDistribution = weights.map((w) => ({
      from: w.from,
      to: w.to,
      rawTraffic: totalWeights === 0 ? MIN_TRAFFIC_RATIO : Math.max(MIN_TRAFFIC_RATIO, w.weight / totalWeights),
    }));

    // console.log('traffic distribution', trafficDistribution);

    // Normalize Traffic Distribution
    const totalTraffic = trafficDistribution.reduce((acc, t) => acc + t.rawTraffic, 0);

    // console.log('total traffic', totalTraffic);
    const normalizedTraffic: NormalizedTraffic[] = trafficDistribution.map((t) => ({
      from: t.from,
      to: t.to,
      normalizedTraffic: t.rawTraffic / totalTraffic, // Normalize to sum up to 1
    }));

    // console.log('normalized traffic', normalizedTraffic);

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

  private optTraffic(data: OptiScalerType, upstream: GraphDataRps[]) {
    // Step 1: Build pod → node mapping for DM pods
    const podToNode = new Map<string, string>();
    for (const pod of data.replicaPods) {
      podToNode.set(pod.pod, pod.node);
    }
    console.log('📌 podToNode map:', podToNode);

    // Step 2: Extract UM pods from upstream.destinations and DM pods from replicaPods
    const umPods: { pod: string; node: string }[] = [];
    const dmPods: { pod: string; node: string }[] = data.replicaPods.map((p) => ({ pod: p.pod, node: p.node }));

    for (const entry of upstream) {
      for (const dest of entry.destinations) {
        umPods.push({ pod: dest.pod, node: entry.node });
      }
    }

    const uniqueUmPods = Array.from(new Map(umPods.map((p) => [p.pod, p])).values());
    const uniqueDmPods = Array.from(new Map(dmPods.map((p) => [p.pod, p])).values());

    console.log('📌 Unique UM pods:', uniqueUmPods);
    console.log('📌 Unique DM pods:', uniqueDmPods);

    // Step 3: Build node-wise mapping of UM/DM pods
    const nodeMap = new Map<string, { ums: string[]; dms: string[] }>();

    for (const { pod, node } of uniqueUmPods) {
      if (!nodeMap.has(node)) nodeMap.set(node, { ums: [], dms: [] });
      nodeMap.get(node)!.ums.push(pod);
    }
    for (const { pod, node } of uniqueDmPods) {
      if (!nodeMap.has(node)) nodeMap.set(node, { ums: [], dms: [] });
      nodeMap.get(node)!.dms.push(pod);
    }
    console.log('📌 nodeMap:', nodeMap);

    const umTraffic = Array(uniqueUmPods.length).fill(1);
    const dmTraffic = Array(uniqueDmPods.length).fill(0);
    const need = uniqueUmPods.length / uniqueDmPods.length;

    const edge: Record<string, number> = {};

    // Step 4: Local (same-node) traffic assignment
    for (const [node, { ums, dms }] of nodeMap.entries()) {
      if (ums.length && dms.length) {
        const weight = ums.length / dms.length >= need ? need / ums.length : 1 / dms.length;
        for (const i of ums) {
          for (const j of dms) {
            const fromNode = node;
            const toNode = node;
            const key = `${fromNode}~${toNode}`;
            edge[key] = (edge[key] ?? 0) + weight;

            const umIdx = uniqueUmPods.findIndex((p) => p.pod === i);
            const dmIdx = uniqueDmPods.findIndex((p) => p.pod === j);
            umTraffic[umIdx] -= weight;
            dmTraffic[dmIdx] += weight;
          }
        }
      }
    }
    console.log('📌 UM traffic after local:', umTraffic);
    console.log('📌 DM traffic after local:', dmTraffic);

    // Step 5: Cross-node distribution to satisfy remaining DM need
    for (const dm of uniqueDmPods) {
      const dmIdx = uniqueDmPods.findIndex((p) => p.pod === dm.pod);
      if (dmTraffic[dmIdx] >= need) continue;

      for (const um of uniqueUmPods) {
        const umIdx = uniqueUmPods.findIndex((p) => p.pod === um.pod);
        if (umTraffic[umIdx] <= 0) continue;

        const fromNode = um.node;
        const toNode = dm.node;
        const available = umTraffic[umIdx];
        const required = need - dmTraffic[dmIdx];
        const allocation = Math.min(available, required);

        if (allocation > 0) {
          const key = `${fromNode}~${toNode}`;
          edge[key] = (edge[key] ?? 0) + allocation;
          umTraffic[umIdx] -= allocation;
          dmTraffic[dmIdx] += allocation;
        }
      }
    }

    console.log('📌 Final DM traffic after cross-node:', dmTraffic);
    console.log('📌 Raw edge weights:', edge);

    // Step 6: Normalize edge weights
    const weights = Object.entries(edge).map(([key, value]) => {
      const [from, to] = key.split('~');
      return { from, to, rawTraffic: value };
    });
    const total = weights.reduce((acc, w) => acc + w.rawTraffic, 0);
    const normalized: NormalizedTraffic[] = weights.map((w) => ({
      from: w.from,
      to: w.to,
      normalizedTraffic: w.rawTraffic / total,
    }));

    console.log('📌 Normalized traffic (per from-node):', normalized);

    return this.convertTrafficDistributionToPercentages(normalized);
  }
  private optTrafficResources(data: OptiScalerType, upstream: GraphDataRps[]) {
    const podToNode = new Map<string, string>();
    for (const pod of data.replicaPods) {
      podToNode.set(pod.pod, pod.node);
    }

    const umPods: { pod: string; node: string }[] = [];
    const dmPods: { pod: string; node: string }[] = data.replicaPods.map((p) => ({ pod: p.pod, node: p.node }));

    for (const entry of upstream) {
      for (const dest of entry.destinations) {
        umPods.push({ pod: dest.pod, node: entry.node });
      }
    }

    const uniqueUmPods = Array.from(new Map(umPods.map((p) => [p.pod, p])).values());
    const uniqueDmPods = Array.from(new Map(dmPods.map((p) => [p.pod, p])).values());

    const nodeMap = new Map<string, { ums: string[]; dms: string[] }>();
    for (const { pod, node } of uniqueUmPods) {
      if (!nodeMap.has(node)) nodeMap.set(node, { ums: [], dms: [] });
      nodeMap.get(node)!.ums.push(pod);
    }
    for (const { pod, node } of uniqueDmPods) {
      if (!nodeMap.has(node)) nodeMap.set(node, { ums: [], dms: [] });
      nodeMap.get(node)!.dms.push(pod);
    }

    const umTraffic = Array(uniqueUmPods.length).fill(1);
    const dmTraffic = Array(uniqueDmPods.length).fill(0);
    const need = uniqueUmPods.length / uniqueDmPods.length;

    const edge: Record<string, number> = {};

    // Latency Map
    const latencyMap = new Map<string, number>();
    for (const { from, to, latency } of data.nodesLatency) {
      latencyMap.set(`${from}~${to}`, latency);
    }
    const totalLatency = Array.from(latencyMap.values()).reduce((acc, val) => acc + val, 0);

    // CPU Map
    const nodeCpuMap = new Map<string, number>();
    for (const pod of data.replicaPods) {
      nodeCpuMap.set(pod.node, (nodeCpuMap.get(pod.node) ?? 0) + pod.percentUsage.cpu);
    }
    const totalLoad = Array.from(nodeCpuMap.values()).reduce((acc, val) => acc + val, 0);

    // Step 4: Local traffic
    for (const [node, { ums, dms }] of nodeMap.entries()) {
      if (ums.length && dms.length) {
        const weight = ums.length / dms.length >= need ? need / ums.length : 1 / dms.length;
        for (const i of ums) {
          for (const j of dms) {
            const fromNode = node;
            const toNode = node;
            const key = `${fromNode}~${toNode}`;

            // Penalties
            // const latency = latencyMap.get(key) ?? 0;
            // const normalizedLatency = totalLatency > 0 ? latency / totalLatency : 0;
            // const latencyPenalty = 1 - Math.min(normalizedLatency, 0.9);

            const nodeLoad = nodeCpuMap.get(toNode) ?? 0;
            const loadRatio = totalLoad > 0 ? nodeLoad / totalLoad : 0;
            const normalizedLoad = Math.min(loadRatio, 0.9);
            const cpuPenalty = 1 - normalizedLoad;

            const penalty = cpuPenalty; //latencyPenalty * cpuPenalty;

            edge[key] = (edge[key] ?? 0) + weight * penalty;

            const umIdx = uniqueUmPods.findIndex((p) => p.pod === i);
            const dmIdx = uniqueDmPods.findIndex((p) => p.pod === j);
            umTraffic[umIdx] -= weight;
            dmTraffic[dmIdx] += weight;
          }
        }
      }
    }

    // Step 5: Cross-node traffic
    for (const dm of uniqueDmPods) {
      const dmIdx = uniqueDmPods.findIndex((p) => p.pod === dm.pod);
      if (dmTraffic[dmIdx] >= need) continue;

      for (const um of uniqueUmPods) {
        const umIdx = uniqueUmPods.findIndex((p) => p.pod === um.pod);
        if (umTraffic[umIdx] <= 0) continue;

        const fromNode = um.node;
        const toNode = dm.node;
        const key = `${fromNode}~${toNode}`;
        const available = umTraffic[umIdx];
        const required = need - dmTraffic[dmIdx];
        const allocation = Math.min(available, required);

        if (allocation > 0) {
          // Penalties
          // const latency = latencyMap.get(key) ?? 0;
          // const normalizedLatency = totalLatency > 0 ? latency / totalLatency : 0;
          // const latencyPenalty = 1 - Math.min(normalizedLatency, 0.9);

          const nodeLoad = nodeCpuMap.get(toNode) ?? 0;
          const loadRatio = totalLoad > 0 ? nodeLoad / totalLoad : 0;
          const normalizedLoad = Math.min(loadRatio, 0.9);
          const cpuPenalty = 1 - normalizedLoad;

          const penalty = cpuPenalty; //latencyPenalty * cpuPenalty;

          edge[key] = (edge[key] ?? 0) + allocation * penalty;

          umTraffic[umIdx] -= allocation;
          dmTraffic[dmIdx] += allocation;
        }
      }
    }

    // Normalize
    const weights = Object.entries(edge).map(([key, value]) => {
      const [from, to] = key.split('~');
      return { from, to, rawTraffic: value };
    });
    const total = weights.reduce((acc, w) => acc + w.rawTraffic, 0);
    const normalized: NormalizedTraffic[] = weights.map((w) => ({
      from: w.from,
      to: w.to,
      normalizedTraffic: w.rawTraffic / total,
    }));

    return this.convertTrafficDistributionToPercentages(normalized);
  }
}

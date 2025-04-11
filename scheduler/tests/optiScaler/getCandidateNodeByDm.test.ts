import { FileSystemHandler } from '../../src/adapters/filesystem';
import { KubernetesAdapterImpl } from '../../src/adapters/k8s';
import { NodeMetrics } from '../../src/adapters/k8s/types';
import { PrometheusAdapterImpl } from '../../src/adapters/prometheus';
import { OptiScaler } from '../../src/core/optiScaler';
import { ScaleAction } from '../../src/core/optiScaler/enums';
import { MetricsType } from '../../src/enums';
import { DummyCluster } from './data/cluster';

let k8s: KubernetesAdapterImpl;
let prometheus: PrometheusAdapterImpl;
let fileSystem = new FileSystemHandler();

beforeAll(() => {
  k8s = new KubernetesAdapterImpl();
  prometheus = new PrometheusAdapterImpl();
});

const weights = {
  CPU: 0.5,
  Memory: 0.5,
};

const commonData = {
  capacity: { cpu: 940, memory: 2802.3984375 },
  allocatable: { cpu: 940, memory: 2802.3984375 },
  requested: { cpu: 850, memory: 872 },
  limits: { cpu: 3225, memory: 2247 },
  freeToUse: { cpu: 300, memory: 1330.3984375 },
};

const commonResourceUsage = {
  usage: {
    cpu: 209.725584,
    memory: 253.30078125,
  },
  percentUsage: {
    cpu: 0.7,
    memory: 0.8,
    cpuAndMemory: 0.666342602944664,
  },
  requested: {
    cpu: 60.00000000000001,
    memory: 104,
  },
  limits: {
    cpu: 300.00000000000006,
    memory: 253,
  },
};

const commonDm = {
  pod: 'adservice-5df696df54-mfskk',
  source_workload: 'frontend',
  source_version: 'unknown',
  source_workload_namespace: 'online-boutique',
  destination_service_name: 'adservice',
  destination_service_namespace: 'online-boutique',
  destination_version: 'unknown',
  destination_workload: 'adservice',
};

describe('OptiScaler => getCandidateNodeByDm', () => {
  /**
   * Scenario 1: Single Downstream Replica on Different Node
   * Description: The current replica pod is running on node1.
   *              There is one downstream pod on node2.
   *              Node2 is in the FT candidate list and has low latency from node1.
   * Expected Output: Node2 should be selected as the candidate node for scaling.
   */

  // it('Single Downstream Replica on Different Node', () => {
  //   const data = {
  //     deployment: 'frontend',
  //     namespace: 'online-boutique',
  //     replicaPods: [
  //       {
  //         node: 'node1',
  //         pod: 'frontend-6b8cdfd545-c8pwc',
  //         ...commonResourceUsage,
  //       },
  //     ],
  //     nodeMetrics: DummyCluster.Nodes,
  //     zonesNodes: DummyCluster.AzTopology,
  //     nodesLatency: DummyCluster.NodesLatency,
  //   };
  //   const DummyDmPods = [
  //     {
  //       node: 'node2',
  //       destinations: [
  //         {
  //           rps: 1.6,
  //           node: 'node2',
  //           ...commonDm,
  //         },
  //       ],
  //     },
  //   ];

  //   const optiScaler = new OptiScaler(ScaleAction.UP, data, { prom: prometheus, k8s: k8s, fileSystem });

  //   const nodes = DummyCluster.Nodes.map((node) => node.name);

  //   const cNode = optiScaler.getCandidateNodeByDm(DummyDmPods, nodes, MetricsType.CPU, weights);

  //   expect(cNode).toBe('node2');
  // });

  /**
   * Scenario 2: Multiple Downstream Pods, Prefer Lower Latency
   * Description: Downstream pods are running on node2 and node3.
   * Node 1 does not have Available resources.
   *              RPS is similar between both nodes.
   *              Latency from the source node to node2 is lower than to node3.
   * Expected Output: Node2 should be selected due to better latency.
   */

  it('Multiple Downstream Pods, Prefer Lower Latency', () => {
    const data = {
      deployment: 'frontend',
      namespace: 'online-boutique',
      replicaPods: [
        {
          node: 'node1',
          pod: 'frontend-6b8cdfd545-c8pwc',
          ...commonResourceUsage,
        },
      ],
      nodeMetrics: [
        {
          name: 'node2',
          zone: 'zone-2',
          ...commonData,
        },
        {
          name: 'node3',
          zone: 'zone-3',
          ...commonData,
        },
      ] as NodeMetrics[],
      zonesNodes: DummyCluster.AzTopology,
      nodesLatency: DummyCluster.NodesLatency,
    };
    const DummyDmPods = [
      {
        node: 'node2',
        destinations: [
          {
            rps: 1.6,
            node: 'node2',
            ...commonDm,
          },
        ],
      },
      {
        node: 'node3',
        destinations: [
          {
            rps: 1.6,
            node: 'node3',
            ...commonDm,
          },
        ],
      },
    ];

    const optiScaler = new OptiScaler(ScaleAction.UP, data, { prom: prometheus, k8s: k8s, fileSystem });

    const nodes = data.nodeMetrics.map((node) => node.name);

    const cNode = optiScaler.getCandidateNodeByDm(DummyDmPods, nodes, MetricsType.CPU, weights);

    expect(cNode).toBe('node2');
  });

  /**
   * Scenario 3: Higher RPS Beats Lower Latency
   * Description: Downstream pods are running on node2 and node3.
   *              Latency to node2 is lower, but node3 has significantly higher RPS.
   *              Node3 is also in the FT candidate list.
   * Expected Output: Node3 should be selected due to higher RPS despite higher latency.
   */
  /**
   * Scenario 4: No Matching Downstream FT Nodes
   * Description: Downstream pods exist only on node4, which is not in the FT candidate list.
   *              FT nodes are node1, node2, and node3.
   *              No matching downstream nodes in FT, so LFU fallback is triggered.
   * Expected Output: The node with least usage among FT nodes (e.g., node2) is selected via LFU.
   */
  /**
   * Scenario 5: Tiebreak with Node Self Latency
   * Description: Downstream pods are on node2 and node3.
   *              Latency and RPS are the same for both.
   *              But node2 has a downstream pod that is local to it (latency = 0).
   * Expected Output: Node2 should be preferred due to local pod presence.
   */
  /**
   * Scenario 6: Cluster Locality with Zones
   * Description: FT candidate nodes are distributed across zone-1 and zone-3.
   *              Downstream pods are available in both zones.
   *              RPS is similar, but intra-zone latency is lower than cross-zone.
   * Expected Output: A candidate node within the same zone as the upstream traffic source should be preferred.
   */
});

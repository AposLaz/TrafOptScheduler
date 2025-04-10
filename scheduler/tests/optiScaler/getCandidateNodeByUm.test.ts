import { FileSystemHandler } from '../../src/adapters/filesystem';
import { KubernetesAdapterImpl } from '../../src/adapters/k8s';
import { NodeMetrics } from '../../src/adapters/k8s/types';
import { PrometheusAdapterImpl } from '../../src/adapters/prometheus';
import { NodesLatency } from '../../src/adapters/prometheus/types';
import { OptiScaler } from '../../src/core/optiScaler';
import { ScaleAction } from '../../src/core/optiScaler/enums';
import { MetricsType } from '../../src/enums';
import { DummyCluster } from './data/cluster';
import { DummyDeployments } from './data/deployment';
import { DummyUpstreamPods } from './data/upstream';

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

const commonUm = {
  pod: 'loadgenerator-ccfcbf6d4-ks996',
  source_workload: 'loadgenerator',
  source_version: 'unknown',
  source_workload_namespace: 'online-boutique',
  destination_service_name: 'frontend',
  destination_service_namespace: 'online-boutique',
  destination_version: 'unknown',
  destination_workload: 'frontend',
};

const resourcesCommon = {
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
describe('OptiScaler => getCandidateNodeByUm', () => {
  /**
   * Scenario 1: One Upstream Replica pod on different Node than the OptiScaler Node
   * Description: The loaded pod node will be the Node2 which will have 1 replica pod of the frontend.
   *              The Upstream replica pod will be located on Node1.
   *              The Node1 will have available resources to add a replica pod of the frontend.
   * Expected Output: The new replica pod should be created on the Node1
   */

  it('One upstream pod on a different node', () => {
    const data = {
      deployment: 'frontend',
      namespace: 'online-boutique',
      replicaPods: [
        {
          node: 'node2',
          pod: 'frontend-6b8cdfd545-c8pwc',
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
        },
      ],
      nodeMetrics: [
        {
          name: 'node3',
          zone: 'zone-3',
          ...commonData,
        },
        {
          name: 'node1',
          zone: 'zone-1',
          ...commonData,
        },
      ] as NodeMetrics[],
      zonesNodes: DummyCluster.AzTopology,
      nodesLatency: DummyCluster.NodesLatency,
    };
    const optiScaler = new OptiScaler(ScaleAction.UP, data, { prom: prometheus, k8s: k8s, fileSystem });

    const nodes = DummyCluster.Nodes.map((node) => node.name);

    const cNode = optiScaler.getCandidateNodeByUm(DummyUpstreamPods, nodes, MetricsType.CPU, weights);

    expect(cNode).toBe('node1');
  });

  /**
   * Scenario 2: Two Upstream Replica pods on different Node than the OptiScaler Node
   * Description: The loaded pod node will be the Node2 which will have 1 replica pod of the frontend.
   *              The Upstream replica pod will be located on Node1, Node2, Node3.
   *              The Node1, Node2, Node3 will have available resources to add a replica pod of the frontend.
   * Expected Output: The new replica pod should be created on the Node1. Node1 -> Node2 have lower latency than the Node3 -> Node2 and higher rps
   */

  it('Multi-upstream with latency-based preference', () => {
    const data = {
      deployment: 'frontend',
      namespace: 'online-boutique',
      replicaPods: DummyDeployments['frontend'],
      nodeMetrics: [
        {
          name: 'node3',
          zone: 'zone-3',
          ...commonData,
        },
        {
          name: 'node1',
          zone: 'zone-1',
          ...commonData,
        },
      ] as NodeMetrics[],
      zonesNodes: DummyCluster.AzTopology,
      nodesLatency: DummyCluster.NodesLatency,
    };
    const optiScaler = new OptiScaler(ScaleAction.UP, data, { prom: prometheus, k8s: k8s, fileSystem });

    const nodes = DummyCluster.Nodes.map((node) => node.name);

    const DummyUm = [
      {
        node: 'node1',
        destinations: [
          {
            rps: 2.3777777777777778,
            node: 'node1',
            ...commonUm,
          },
        ],
      },
      {
        node: 'node3',
        destinations: [
          {
            rps: 2.2,
            node: 'node3',
            ...commonUm,
          },
        ],
      },
    ];
    const cNode = optiScaler.getCandidateNodeByUm(DummyUm, nodes, MetricsType.CPU, weights);

    expect(cNode).toBe('node1');
  });

  /**
   * Scenario 3: 5 Upstream Replica pods
   * Description: The loaded pod node will be the Node2 which will have 1 replica pod of the frontend.
   *              The Upstream replica pods will be located on Node1 (1 rs), Node2 (1 rs), Node3 (3 rs).
   *              The Node1, Node2, Node3 will have available resources to add a replica pod of the frontend.
   * Expected Output: The new replica pod should be created on the Node3. Node1 -> Node2 have lower latency than the Node3 -> Node2
   *                  but Node3 have more rps than Node1.
   */

  it('Upstream count and latency tradeoff', () => {
    const data = {
      deployment: 'frontend',
      namespace: 'online-boutique',
      replicaPods: DummyDeployments['frontend'],
      nodeMetrics: DummyCluster.Nodes,
      zonesNodes: DummyCluster.AzTopology,
      nodesLatency: DummyCluster.NodesLatency,
    };
    const optiScaler = new OptiScaler(ScaleAction.UP, data, { prom: prometheus, k8s: k8s, fileSystem });

    const nodes = DummyCluster.Nodes.map((node) => node.name);

    const DummyUm = [
      {
        node: 'node1',
        destinations: [
          {
            rps: 2.2,
            node: 'node1',
            ...commonUm,
          },
        ],
      },
      {
        node: 'node2',
        destinations: [
          {
            rps: 2.5,
            node: 'node2',
            ...commonUm,
          },
        ],
      },
      {
        node: 'node3',
        destinations: [
          {
            rps: 2.8,
            node: 'node3',
            ...commonUm,
          },
        ],
      },
      {
        node: 'node3',
        destinations: [
          {
            rps: 2.8,
            node: 'node3',
            ...commonUm,
          },
        ],
      },
    ];
    const cNode = optiScaler.getCandidateNodeByUm(DummyUm, nodes, MetricsType.CPU, weights);

    expect(cNode).toBe('node3');
  });

  /**
   * Scenario 4: 7 Upstream Replica pods.
   * Description: The loaded pod node will be the Node2 which will have 3 distributed replica pods of the frontend.
   *              The Upstream replica pods will be located on Node1 (1 rs), Node2 (3 rs), Node3 (3 rs).
   *              The Node1, Node2, Node3 will have available resources to add a replica pod of the frontend.
   * Expected Output: The new replica pod should be created on the Node3 (Because latency on Node3 -> from Node3 = 0). Node1 -> Node2 have lower latency than the Node3 -> Node2
   *                  but Node3 have more rps than Node1 (no much higher).
   */

  it('Replica saturation across nodes', () => {
    const data = {
      deployment: 'frontend',
      namespace: 'online-boutique',
      replicaPods: DummyDeployments['frontend'],
      nodeMetrics: DummyCluster.Nodes,
      zonesNodes: DummyCluster.AzTopology,
      nodesLatency: [
        {
          from: 'node1',
          to: 'node2',
          latency: 0.5,
        },
        {
          from: 'node2',
          to: 'node1',
          latency: 0.5,
        },
        {
          from: 'node1',
          to: 'node3',
          latency: 4,
        },
        {
          from: 'node3',
          to: 'node1',
          latency: 0.6,
        },
        {
          from: 'node3',
          to: 'node2',
          latency: 5,
        },
        {
          from: 'node2',
          to: 'node3',
          latency: 5,
        },
        {
          from: 'node1',
          to: 'node1',
          latency: 0,
        },
        {
          from: 'node2',
          to: 'node2',
          latency: 0,
        },
        {
          from: 'node3',
          to: 'node3',
          latency: 0,
        },
      ] as NodesLatency[],
    };
    const optiScaler = new OptiScaler(ScaleAction.UP, data, { prom: prometheus, k8s: k8s, fileSystem });

    const nodes = DummyCluster.Nodes.map((node) => node.name);

    const DummyUm = [
      {
        node: 'node1',
        destinations: [
          {
            rps: 2,
            node: 'node1',
            ...commonUm,
          },
        ],
      },
      {
        node: 'node2',
        destinations: [
          {
            rps: 2,
            node: 'node2',
            ...commonUm,
          },
        ],
      },
      {
        node: 'node2',
        destinations: [
          {
            rps: 2,
            node: 'node2',
            ...commonUm,
          },
        ],
      },
      {
        node: 'node2',
        destinations: [
          {
            rps: 2,
            node: 'node2',
            ...commonUm,
          },
        ],
      },
      {
        node: 'node3',
        destinations: [
          {
            rps: 3,
            node: 'node3',
            ...commonUm,
          },
        ],
      },
      {
        node: 'node3',
        destinations: [
          {
            rps: 3,
            node: 'node3',
            ...commonUm,
          },
        ],
      },
      {
        node: 'node3',
        destinations: [
          {
            rps: 3,
            node: 'node3',
            ...commonUm,
          },
        ],
      },
    ];
    const cNode = optiScaler.getCandidateNodeByUm(DummyUm, nodes, MetricsType.CPU, weights);

    expect(cNode).toBe('node1');
  });
});

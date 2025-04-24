import type { GraphDataRps } from '../../../src/adapters/prometheus/types';
import type { NodeLatency, NodeMetrics } from '../../../src/k8s/types';
import type { DeploymentMultipleRs, DeploymentSingleRs } from '../../../src/types';

export const DUMMY_DATA: {
  metricNodes: NodeMetrics[];
  criticalPods: {
    singleRs: DeploymentSingleRs[];
    multipleRs: DeploymentMultipleRs[];
  };
  downstreamPods: GraphDataRps[];
  upstreamSumRpsByNode: { [key: string]: number };
  upstreamPods: GraphDataRps[];
  nodeLatency: NodeLatency[];
} = {
  metricNodes: [
    {
      name: 'node-1',
      capacity: { cpu: 1930, memory: 6030.9609375 },
      allocatable: { cpu: 1930, memory: 6030.9609375 },
      requested: { cpu: 1563.0000000000007, memory: 1614.5367431640625 },
      limits: { cpu: 4768, memory: 3626 },
      freeToUse: { cpu: 366.9999999999993, memory: 4416.4241943359375 },
    },
    {
      name: 'node-2',
      capacity: { cpu: 1930, memory: 6030.9609375 },
      allocatable: { cpu: 1930, memory: 6030.9609375 },
      requested: { cpu: 1150.0000000000002, memory: 1376 },
      limits: { cpu: 7999.999999999999, memory: 6325 },
      freeToUse: { cpu: 779.9999999999998, memory: 4654.9609375 },
    },
    {
      name: 'node-3',
      capacity: { cpu: 940, memory: 2804.953125 },
      allocatable: { cpu: 940, memory: 2804.953125 },
      requested: { cpu: 225.00000000000003, memory: 180 },
      limits: { cpu: 1200, memory: 855 },
      freeToUse: { cpu: 715, memory: 2624.953125 },
    },
    {
      name: 'node-4',
      capacity: { cpu: 940, memory: 2804.9609375 },
      allocatable: { cpu: 940, memory: 2804.9609375 },
      requested: { cpu: 335, memory: 440 },
      limits: { cpu: 1500, memory: 1433 },
      freeToUse: { cpu: 605, memory: 2364.9609375 },
    },
  ],
  criticalPods: {
    singleRs: [
      {
        deployment: 'frontend',
        pods: {
          name: 'frontend-57df484f56-xz2hg',
          node: 'node-2',
          usage: {
            cpu: 137.753234,
            memory: 160.15234375,
          },
          percentUsage: {
            cpu: 0.68876617,
            memory: 0.8524225603070176,
            cpuAndMemory: 0.7524225603070176,
          },
          requested: {
            cpu: 60.00000000000001,
            memory: 104,
          },
          limits: {
            cpu: 200,
            memory: 228,
          },
        },
      },
    ],
    multipleRs: [],
  },
  downstreamPods: [
    {
      node: 'node-2',
      destinations: [
        {
          rps: 44.666666666666664,
          node: 'node-2',
          pod: 'currencyservice-546f88db95-cklzz',
          source_workload: 'frontend',
          source_version: 'unknown',
          source_workload_namespace: 'online-boutique',
          destination_service_name: 'currencyservice',
          destination_service_namespace: 'online-boutique',
          destination_version: 'unknown',
          destination_workload: 'currencyservice',
        },
        {
          rps: 5.51111111111111,
          node: 'node-2',
          pod: 'recommendationservice-955d6cc9-q8fhw',
          source_workload: 'frontend',
          source_version: 'unknown',
          source_workload_namespace: 'online-boutique',
          destination_service_name: 'recommendationservice',
          destination_service_namespace: 'online-boutique',
          destination_version: 'unknown',
          destination_workload: 'recommendationservice',
        },
        {
          rps: 4.355555555555555,
          node: 'node-2',
          pod: 'adservice-9d8749b9f-8mzx6',
          source_workload: 'frontend',
          source_version: 'unknown',
          source_workload_namespace: 'online-boutique',
          destination_service_name: 'adservice',
          destination_service_namespace: 'online-boutique',
          destination_version: 'unknown',
          destination_workload: 'adservice',
        },
      ],
    },
    {
      node: 'node-1',
      destinations: [
        {
          rps: 70.28888888888888,
          node: 'node-1',
          pod: 'productcatalogservice-648bf7bdd-ljqjq',
          source_workload: 'frontend',
          source_version: 'unknown',
          source_workload_namespace: 'online-boutique',
          destination_service_name: 'productcatalogservice',
          destination_service_namespace: 'online-boutique',
          destination_version: 'unknown',
          destination_workload: 'productcatalogservice',
        },
        {
          rps: 13.599999999999998,
          node: 'node-1',
          pod: 'cartservice-5cd4c99758-6knct',
          source_workload: 'frontend',
          source_version: 'unknown',
          source_workload_namespace: 'online-boutique',
          destination_service_name: 'cartservice',
          destination_service_namespace: 'online-boutique',
          destination_version: 'unknown',
          destination_workload: 'cartservice',
        },
        {
          rps: 4.422222222222222,
          node: 'node-1',
          pod: 'adservice-9d8749b9f-m2rlz',
          source_workload: 'frontend',
          source_version: 'unknown',
          source_workload_namespace: 'online-boutique',
          destination_service_name: 'adservice',
          destination_service_namespace: 'online-boutique',
          destination_version: 'unknown',
          destination_workload: 'adservice',
        },
        {
          rps: 3.266666666666666,
          node: 'node-1',
          pod: 'shippingservice-56548ddfbd-jrzps',
          source_workload: 'frontend',
          source_version: 'unknown',
          source_workload_namespace: 'online-boutique',
          destination_service_name: 'shippingservice',
          destination_service_namespace: 'online-boutique',
          destination_version: 'unknown',
          destination_workload: 'shippingservice',
        },
        {
          rps: 0.5111111111111111,
          node: 'node-1',
          pod: 'checkoutservice-5496fbbb8f-rxrwv',
          source_workload: 'frontend',
          source_version: 'unknown',
          source_workload_namespace: 'online-boutique',
          destination_service_name: 'checkoutservice',
          destination_service_namespace: 'online-boutique',
          destination_version: 'unknown',
          destination_workload: 'checkoutservice',
        },
      ],
    },
    {
      node: 'node-4',
      destinations: [
        {
          rps: 5.333333333333333,
          node: 'node-4',
          pod: 'recommendationservice-955d6cc9-cstz8',
          source_workload: 'frontend',
          source_version: 'unknown',
          source_workload_namespace: 'online-boutique',
          destination_service_name: 'recommendationservice',
          destination_service_namespace: 'online-boutique',
          destination_version: 'unknown',
          destination_workload: 'recommendationservice',
        },
      ],
    },
  ],
  upstreamSumRpsByNode: {
    'node-1': 120,
    'node-2': 75,
  },
  upstreamPods: [
    {
      node: 'node-1',
      destinations: [
        {
          rps: 40,
          node: 'node-1',
          pod: 'loadgenerator-8c56d9448-f92qc',
          source_workload: 'loadgenerator',
          source_version: 'unknown',
          source_workload_namespace: 'online-boutique',
          destination_service_name: 'frontend',
          destination_service_namespace: 'online-boutique',
          destination_version: 'unknown',
          destination_workload: 'frontend',
        },
        {
          rps: 40,
          node: 'node-1',
          pod: 'loadgenerator-8c56d9448-5f4nk',
          source_workload: 'loadgenerator',
          source_version: 'unknown',
          source_workload_namespace: 'online-boutique',
          destination_service_name: 'frontend',
          destination_service_namespace: 'online-boutique',
          destination_version: 'unknown',
          destination_workload: 'frontend',
        },
        {
          rps: 40,
          node: 'node-1',
          pod: 'loadgenerator-8c56d9448-54vh9',
          source_workload: 'loadgenerator',
          source_version: 'unknown',
          source_workload_namespace: 'online-boutique',
          destination_service_name: 'frontend',
          destination_service_namespace: 'online-boutique',
          destination_version: 'unknown',
          destination_workload: 'frontend',
        },
      ],
    },
    {
      node: 'node-2',
      destinations: [
        {
          rps: 25,
          node: 'node-2',
          pod: 'loadgenerator-8c56d9448-v5ksp',
          source_workload: 'loadgenerator',
          source_version: 'unknown',
          source_workload_namespace: 'online-boutique',
          destination_service_name: 'frontend',
          destination_service_namespace: 'online-boutique',
          destination_version: 'unknown',
          destination_workload: 'frontend',
        },
        {
          rps: 25,
          node: 'node-2',
          pod: 'loadgenerator-8c56d9448-5km9s',
          source_workload: 'loadgenerator',
          source_version: 'unknown',
          source_workload_namespace: 'online-boutique',
          destination_service_name: 'frontend',
          destination_service_namespace: 'online-boutique',
          destination_version: 'unknown',
          destination_workload: 'frontend',
        },
        {
          rps: 25,
          node: 'node-2',
          pod: 'loadgenerator-8c56d9448-2fmwv',
          source_workload: 'loadgenerator',
          source_version: 'unknown',
          source_workload_namespace: 'online-boutique',
          destination_service_name: 'frontend',
          destination_service_namespace: 'online-boutique',
          destination_version: 'unknown',
          destination_workload: 'frontend',
        },
      ],
    },
  ],
  nodeLatency: [
    {
      from: 'node-1',
      to: 'node-1',
      latency: 2,
    },
    {
      from: 'node-1',
      to: 'node-2',
      latency: 6,
    },
    {
      from: 'node-1',
      to: 'node-3',
      latency: 6,
    },
    {
      from: 'node-1',
      to: 'node-4',
      latency: 2,
    },
    {
      from: 'node-2',
      to: 'node-1',
      latency: 6,
    },
    {
      from: 'node-2',
      to: 'node-2',
      latency: 1,
    },
    {
      from: 'node-2',
      to: 'node-3',
      latency: 4,
    },
    {
      from: 'node-2',
      to: 'node-4',
      latency: 12,
    },
    {
      from: 'node-3',
      to: 'node-1',
      latency: 6,
    },
    {
      from: 'node-3',
      to: 'node-2',
      latency: 4,
    },
    {
      from: 'node-3',
      to: 'node-3',
      latency: 1,
    },
    {
      from: 'node-3',
      to: 'node-4',
      latency: 6,
    },
    {
      from: 'node-4',
      to: 'node-1',
      latency: 2,
    },
    {
      from: 'node-4',
      to: 'node-2',
      latency: 12,
    },
    {
      from: 'node-4',
      to: 'node-3',
      latency: 6,
    },
    {
      from: 'node-4',
      to: 'node-4',
      latency: 2,
    },
    // test data that should not be returned all
    {
      from: 'node-1',
      to: 'test-no-resources-1',
      latency: 1,
    },
    {
      from: 'node-2',
      to: 'node-no-resources',
      latency: 1,
    },
    {
      from: 'test-no-resources-1',
      to: 'node-3',
      latency: 1,
    },
    {
      from: 'test-no-resources-3', // node with no resources available
      to: 'node-2', // node that the pod is located. Need to create a new replica to another Node if it is possible
      latency: 1,
    },
    {
      from: 'node-4',
      to: 'test-no-resources-2',
      latency: 1,
    },
    {
      from: 'test-no-resources-1',
      to: 'test-no-resources-2',
      latency: 1,
    },
  ],
};

export const productCatalogService = {
  deployment: 'productcatalogservice',
  pods: {
    name: 'productcatalogservice-648bf7bdd-ljqjq',
    node: 'gke-cluster-0-pool-1-3331e9fa-tj14',
    usage: {
      cpu: 137.753234,
      memory: 160.15234375,
    },
    percentUsage: {
      cpu: 0.68876617,
      memory: 0.8524225603070176,
      cpuAndMemory: 0.7524225603070176,
    },
    requested: {
      cpu: 60.00000000000001,
      memory: 104,
    },
    limits: {
      cpu: 200,
      memory: 228,
    },
  },
};

import type { NodeMetrics } from '../../../src/k8s/types';

export const DummyAzTopology = {
  'zone-1': { nodes: ['node1', 'node11', 'node12'] },
  'zone-2': { nodes: ['node2'] },
  'zone-3': { nodes: ['node3'] },
  'zone-4': { nodes: ['node41', 'node42'] },
};

export const DummyNodes: NodeMetrics[] = [
  {
    name: 'node3',
    zone: 'zone-3',
    capacity: { cpu: 940, memory: 2802.40625 },
    allocatable: { cpu: 940, memory: 2802.40625 },
    requested: { cpu: 935, memory: 1256 },
    limits: { cpu: 6899.999999999999, memory: 5829 },
    freeToUse: { cpu: 5, memory: 1546.40625 },
  },
  {
    name: 'node2',
    zone: 'zone-2',
    capacity: { cpu: 940, memory: 2802.3984375 },
    allocatable: { cpu: 940, memory: 2802.3984375 },
    requested: { cpu: 893.0000000000001, memory: 622.5367431640625 },
    limits: { cpu: 2943.0000000000005, memory: 1662 },
    freeToUse: { cpu: 46.999999999999886, memory: 2179.8616943359375 },
  },
  {
    name: 'node1',
    zone: 'zone-1',
    capacity: { cpu: 940, memory: 2802.3984375 },
    allocatable: { cpu: 940, memory: 2802.3984375 },
    requested: { cpu: 850, memory: 872 },
    limits: { cpu: 3225, memory: 2247 },
    freeToUse: { cpu: 300, memory: 1930.3984375 },
  },
];

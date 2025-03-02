import type { DeploymentReplicaPodsMetrics } from '../../../src/types';

export const DummyDeployments: DeploymentReplicaPodsMetrics = {
  adservice: [
    {
      node: 'node1',
      pod: 'adservice-5f69987fd7-zmfbp',
      usage: {
        cpu: 37.19573,
        memory: 135.87890625,
      },
      percentUsage: {
        cpu: 0.07439145999999999,
        memory: 0.31971507352941175,
        cpuAndMemory: 0.19705326676470586,
      },
      requested: {
        cpu: 210.00000000000003,
        memory: 220,
      },
      limits: {
        cpu: 500,
        memory: 425,
      },
    },
  ],
  cartservice: [
    {
      node: 'node2',
      pod: 'cartservice-5d6db7f7f9-qgz64',
      usage: {
        cpu: 28.447463,
        memory: 90.48046875,
      },
      percentUsage: {
        cpu: 0.056894926,
        memory: 0.35763031126482214,
        cpuAndMemory: 0.20726261863241108,
      },
      requested: {
        cpu: 210.00000000000003,
        memory: 104,
      },
      limits: {
        cpu: 500,
        memory: 253,
      },
    },
  ],
  checkoutservice: [
    {
      node: 'node1',
      pod: 'checkoutservice-59c7c794b9-6jnpq',
      usage: {
        cpu: 3.124073,
        memory: 48.19140625,
      },
      percentUsage: {
        cpu: 0.0078101825,
        memory: 0.19047986660079053,
        cpuAndMemory: 0.09914502455039527,
      },
      requested: {
        cpu: 110,
        memory: 104,
      },
      limits: {
        cpu: 400,
        memory: 253,
      },
    },
    {
      node: 'node3',
      pod: 'checkoutservice-59c7c794b9-8jv2j',
      usage: {
        cpu: 3.246622,
        memory: 48.0390625,
      },
      percentUsage: {
        cpu: 0.008116555,
        memory: 0.18987771739130435,
        cpuAndMemory: 0.09899713619565217,
      },
      requested: {
        cpu: 110,
        memory: 104,
      },
      limits: {
        cpu: 400,
        memory: 253,
      },
    },
    {
      node: 'node2',
      pod: 'checkoutservice-59c7c794b9-kfhn7',
      usage: {
        cpu: 2.827604,
        memory: 48.35546875,
      },
      percentUsage: {
        cpu: 0.00706901,
        memory: 0.19112833498023715,
        cpuAndMemory: 0.09909867249011857,
      },
      requested: {
        cpu: 110,
        memory: 104,
      },
      limits: {
        cpu: 400,
        memory: 253,
      },
    },
  ],
  currencyservice: [
    {
      node: 'node3',
      pod: 'currencyservice-67b68c5979-9t5k9',
      usage: {
        cpu: 211.761428,
        memory: 101.26171875,
      },
      percentUsage: {
        cpu: 0.5294035699999999,
        memory: 0.4002439476284585,
        cpuAndMemory: 0.4648237588142292,
      },
      requested: {
        cpu: 110,
        memory: 104,
      },
      limits: {
        cpu: 400,
        memory: 253,
      },
    },
  ],
  emailservice: [
    {
      node: 'node3',
      pod: 'emailservice-6dc69bd564-878qj',
      usage: {
        cpu: 3.6816039999999997,
        memory: 80.87890625,
      },
      percentUsage: {
        cpu: 0.009204009999999999,
        memory: 0.31967947134387353,
        cpuAndMemory: 0.16444174067193676,
      },
      requested: {
        cpu: 110,
        memory: 104,
      },
      limits: {
        cpu: 400,
        memory: 253,
      },
    },
  ],
  frontend: [
    {
      node: 'gke-cluster-2-pool-1-65f94896-zhc4',
      pod: 'frontend-54848df4db-nrw9s',
      usage: {
        cpu: 209.725584,
        memory: 253.30078125,
      },
      percentUsage: {
        cpu: 0.6990852799999998,
        memory: 0.803599925889328,
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
  loadgenerator: [
    {
      node: 'node3',
      pod: 'loadgenerator-766cc88888-479c6',
      usage: {
        cpu: 4.203495,
        memory: 80.08984375,
      },
      percentUsage: {
        cpu: 0.021017475,
        memory: 0.64071875,
        cpuAndMemory: 0.3308681125,
      },
      requested: {
        cpu: 10,
        memory: 40,
      },
      limits: {
        cpu: 200,
        memory: 125,
      },
    },
    {
      node: 'node3',
      pod: 'loadgenerator-766cc88888-4dz4r',
      usage: {
        cpu: 4.416466,
        memory: 80.15625,
      },
      percentUsage: {
        cpu: 0.022082329999999997,
        memory: 0.64125,
        cpuAndMemory: 0.331666165,
      },
      requested: {
        cpu: 10,
        memory: 40,
      },
      limits: {
        cpu: 200,
        memory: 125,
      },
    },
    {
      node: 'node2',
      pod: 'loadgenerator-766cc88888-7c27k',
      usage: {
        cpu: 4.313172000000001,
        memory: 79.8359375,
      },
      percentUsage: {
        cpu: 0.021565860000000003,
        memory: 0.6386875,
        cpuAndMemory: 0.33012668,
      },
      requested: {
        cpu: 10,
        memory: 40,
      },
      limits: {
        cpu: 200,
        memory: 125,
      },
    },
    {
      node: 'node2',
      pod: 'loadgenerator-766cc88888-7prfx',
      usage: {
        cpu: 3.996736,
        memory: 80.15234375,
      },
      percentUsage: {
        cpu: 0.01998368,
        memory: 0.64121875,
        cpuAndMemory: 0.33060121499999995,
      },
      requested: {
        cpu: 10,
        memory: 40,
      },
      limits: {
        cpu: 200,
        memory: 125,
      },
    },
    {
      node: 'node2',
      pod: 'loadgenerator-766cc88888-flk78',
      usage: {
        cpu: 4.345269,
        memory: 79.7265625,
      },
      percentUsage: {
        cpu: 0.021726345,
        memory: 0.6378125,
        cpuAndMemory: 0.3297694225,
      },
      requested: {
        cpu: 10,
        memory: 40,
      },
      limits: {
        cpu: 200,
        memory: 125,
      },
    },
    {
      node: 'node1',
      pod: 'loadgenerator-766cc88888-gflxb',
      usage: {
        cpu: 4.766262,
        memory: 79.91796875,
      },
      percentUsage: {
        cpu: 0.02383131,
        memory: 0.63934375,
        cpuAndMemory: 0.33158753,
      },
      requested: {
        cpu: 10,
        memory: 40,
      },
      limits: {
        cpu: 200,
        memory: 125,
      },
    },
    {
      node: 'node1',
      pod: 'loadgenerator-766cc88888-td7kw',
      usage: {
        cpu: 4.222121,
        memory: 80.44140625,
      },
      percentUsage: {
        cpu: 0.021110604999999998,
        memory: 0.64353125,
        cpuAndMemory: 0.3323209275,
      },
      requested: {
        cpu: 10,
        memory: 40,
      },
      limits: {
        cpu: 200,
        memory: 125,
      },
    },
    {
      node: 'node1',
      pod: 'loadgenerator-766cc88888-wnr5j',
      usage: {
        cpu: 4.293315,
        memory: 80.03515625,
      },
      percentUsage: {
        cpu: 0.021466574999999998,
        memory: 0.64028125,
        cpuAndMemory: 0.33087391250000003,
      },
      requested: {
        cpu: 10,
        memory: 40,
      },
      limits: {
        cpu: 200,
        memory: 125,
      },
    },
  ],
  paymentservice: [
    {
      node: 'node3',
      pod: 'paymentservice-7cb649bf68-r7gwl',
      usage: {
        cpu: 2.726014,
        memory: 53.73828125,
      },
      percentUsage: {
        cpu: 0.0068150350000000005,
        memory: 0.212404273715415,
        cpuAndMemory: 0.1096096543577075,
      },
      requested: {
        cpu: 110,
        memory: 104,
      },
      limits: {
        cpu: 400,
        memory: 253,
      },
    },
  ],
  productcatalogservice: [
    {
      node: 'node1',
      pod: 'productcatalogservice-7568b9b976-zv97l',
      usage: {
        cpu: 30.688368,
        memory: 60.6796875,
      },
      percentUsage: {
        cpu: 0.07672092,
        memory: 0.23984066205533597,
        cpuAndMemory: 0.15828079102766798,
      },
      requested: {
        cpu: 110,
        memory: 104,
      },
      limits: {
        cpu: 400,
        memory: 253,
      },
    },
  ],
  recommendationservice: [
    {
      node: 'node3',
      pod: 'recommendationservice-7cdb6d5ff8-tlf8s',
      usage: {
        cpu: 8.953722,
        memory: 80.3671875,
      },
      percentUsage: {
        cpu: 0.022384305000000004,
        memory: 0.13976902173913044,
        cpuAndMemory: 0.08107666336956522,
      },
      requested: {
        cpu: 110,
        memory: 260,
      },
      limits: {
        cpu: 400,
        memory: 575,
      },
    },
    {
      node: 'node2',
      pod: 'recommendationservice-7cdb6d5ff8-z7dwc',
      usage: {
        cpu: 8.728896,
        memory: 80.10546875,
      },
      percentUsage: {
        cpu: 0.021822240000000003,
        memory: 0.1393138586956522,
        cpuAndMemory: 0.08056804934782609,
      },
      requested: {
        cpu: 110,
        memory: 260,
      },
      limits: {
        cpu: 400,
        memory: 575,
      },
    },
  ],
  'redis-cart': [
    {
      node: 'node1',
      pod: 'redis-cart-69799556c7-d7zpx',
      usage: {
        cpu: 7.478625999999999,
        memory: 39.734375,
      },
      percentUsage: {
        cpu: 0.023011156923076922,
        memory: 0.10428969816272966,
        cpuAndMemory: 0.06365042754290329,
      },
      requested: {
        cpu: 80,
        memory: 240,
      },
      limits: {
        cpu: 325,
        memory: 381,
      },
    },
  ],
  shippingservice: [
    {
      node: 'node1',
      pod: 'shippingservice-754cc5f4-6hjlj',
      usage: {
        cpu: 3.8005079999999998,
        memory: 47.6171875,
      },
      percentUsage: {
        cpu: 0.00950127,
        memory: 0.18821022727272727,
        cpuAndMemory: 0.09885574863636364,
      },
      requested: {
        cpu: 110,
        memory: 104,
      },
      limits: {
        cpu: 400,
        memory: 253,
      },
    },
  ],
};

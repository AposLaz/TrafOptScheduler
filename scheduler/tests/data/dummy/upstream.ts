export const upstreamPods = [
  {
    node: 'gke-cluster-2-pool-1-93709e9b-hh6c',
    destinations: [
      {
        rps: 2.3777777777777778,
        node: 'gke-cluster-2-pool-1-93709e9b-hh6c',
        pod: 'loadgenerator-ccfcbf6d4-ks996',
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
];

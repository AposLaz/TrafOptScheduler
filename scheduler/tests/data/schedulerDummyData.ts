export const noRootCriticalPods = {
  singleRs: [
    {
      deployment: 'frontend',
      pods: {
        name: 'frontend-7b7c5f56d9-55zj8',
        node: 'gke-cluster-0-pool-1-88f8baf7-qblr',
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
  multiRs: [],
};

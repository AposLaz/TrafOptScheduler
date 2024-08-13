import { DeploymentPlacementModel } from '../types';

export const deployModels: DeploymentPlacementModel[] = [
  //   {
  //     deploymentName: 'busybox-deployment',
  //     nodes: ['gke-cluster-0-default-pool-7683fa15-t295'],
  //     namespace: 'default',
  //     deletePod: 'busybox-deployment-5bd9b9fc8-p8ljm', // delete a random pod from another node
  //   },
  {
    deploymentName: 'server-app-deployment',
    nodes: ['gke-cluster-0-default-pool-26c0f871-9nf6'], // this node get taints
    namespace: 'default',
    deletePod: 'server-app-deployment-866c44c547-56slj', // delete a random pod from another node
  },
  {
    deploymentName: 'pong-server-deployment',
    nodes: ['gke-cluster-0-default-pool-7683fa15-t295'],
    namespace: 'default',
    deletePod: 'pong-server-deployment-69d87f5567-v94mv',
  },
];

// NAME                                      READY   STATUS    RESTARTS   AGE     IP           NODE                                       NOMINATED NODE   READINESS GATES
// busybox-deployment-d67b9d558-4f48j        1/1     Running   0          2m12s   10.76.0.24   gke-cluster-0-default-pool-7683fa15-t295   <none>           <none>
// pong-server-deployment-69d87f5567-2fvsv   1/1     Running   0          36s     10.76.1.24   gke-cluster-0-default-pool-26c0f871-9nf6   <none>           <none>
// pong-server-deployment-69d87f5567-pq9cr   1/1     Running   0          27m     10.76.1.15   gke-cluster-0-default-pool-26c0f871-9nf6   <none>           <none>
// pong-server-deployment-69d87f5567-v94mv   1/1     Running   0          22m     10.76.0.17   gke-cluster-0-default-pool-7683fa15-t295   <none>           <none>
// server-app-deployment-866c44c547-56slj    1/1     Running   0          4m18s   10.76.1.22   gke-cluster-0-default-pool-26c0f871-9nf6   <none>           <none>

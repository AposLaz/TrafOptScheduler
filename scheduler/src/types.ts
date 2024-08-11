export type ReplicasAction = 'add' | 'delete';

export type DeploymentPlacementModel = {
  deploymentName: string;
  node: string;
  namespace: string;
  deletePod: string;
};

export type DeploymentNotReadyFilesystem = Omit<
  DeploymentPlacementModel,
  'node'
>;

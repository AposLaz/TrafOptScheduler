import { TaintEffects } from '../enums';
import * as k8s from '@kubernetes/client-node';
import {
  DeploymentNotReadyFilesystem,
  DeploymentPlacementModel,
} from '../types';

const k8sMapper = {
  toNodeTaints: (taintDeploy: DeploymentPlacementModel): k8s.V1Taint => ({
    key: taintDeploy.deploymentName, // key is the pod name
    effect: TaintEffects.NO_SCHEDULE,
  }),
  toDeployStore: (
    deployment: DeploymentPlacementModel
  ): DeploymentNotReadyFilesystem => ({
    deploymentName: deployment.deploymentName, // key is the pod name
    namespace: deployment.namespace,
    deletePod: deployment.deletePod,
  }),
};

export { k8sMapper };

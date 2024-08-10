import { Operators, TaintEffects } from '../enums';
import * as k8s from '@kubernetes/client-node';

const k8sMapper = {
  toNodeTaints: (deployments: string[]): k8s.V1Taint[] => {
    return deployments.map((deploy) => ({
      key: deploy, // key is the pod name
      operator: Operators.EXISTS,
      effect: TaintEffects.NO_SCHEDULE,
    }));
  },
  toDeployToleration: (deployments: string[]): k8s.V1Toleration[] => {
    return deployments.map((deploy) => ({
      key: deploy, // key is the pod name
      operator: Operators.EXISTS,
      effect: TaintEffects.NO_SCHEDULE,
    }));
  },
};

export { k8sMapper };

// a test that will retrieve all pods from the online-boutique namespace.
// The result must be an array with all the pods that are running in the namespace.
// get the resources
// scale the replica pods of the generator
// get the resources again
// get the resources that the pods have reached the limit of 80% CPU

import path from 'path';

import { logger } from '../src/config/logger';
import { KubernetesManager } from '../src/k8s/manager';

jest.setTimeout(120000);

let k8sManager: KubernetesManager; // Declare k8sManager in the outer scope

// connect to the client
// deploy the app to the namespace
beforeAll(async () => {
  logger.info('set up the environment');
  k8sManager = new KubernetesManager();

  // create namespace
  // await k8sManager.createNamespace('online-boutique', {
  //   'istio-injection': 'enabled',
  // });

  // deploy the application from the yaml files
  // const yamlPath = path.join(__dirname, 'data', 'online-boutique');
  // const res = await k8sManager.applyResourcesFromFile(yamlPath);

  // expect(res.length).toBe(0);
});

// disconnect from the client
// delete the app from the namespace
afterAll(() => {
  // TODO delete the namespace
  // TODO delete the application in this namespace
  console.log('tearDown the app');
});

describe('getPodsResourcesAndCritical', () => {
  let podMetrics = [];

  test('get pod metrics', async () => {
    const podMetrics =
      await k8sManager.getClassifiedPodsByThreshold('online-boutique');

    console.log(podMetrics.aboveThreshold);
    console.log(podMetrics.belowThreshold);
    //TODO compare the list request and limit resources with the json dummy data

    // check if metrics reached the limit of 80%
    // If pods not have request and limits, set up as the limit the 80% of the left space in Node
  });
});

test('Calculator Tests', () => {
  console.log('we are ok');
});

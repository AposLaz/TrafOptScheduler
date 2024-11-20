// a test that will retrieve all pods from the online-boutique namespace.
// The result must be an array with all the pods that are running in the namespace.
// get the resources
// scale the replica pods of the generator
// get the resources again
// get the resources that the pods have reached the limit of 80% CPU

import { K8sManager } from '../src/services/k8s/K8sManager';

// connect to the client
// deploy the app to the namespace
beforeAll(async () => {
  console.log('setUp the app');
  // create namespace
  const k8sManager = new K8sManager();

  await k8sManager.createNamespace('online-boutique', {
    'istio-injection': 'enabled',
  });
  // deploy the application
});

// disconnect from the client
// delete the app from the namespace
afterAll(() => {
  console.log('tearDown the app');
});

test('Calculator Tests', () => {
  console.log('we are ok');
});

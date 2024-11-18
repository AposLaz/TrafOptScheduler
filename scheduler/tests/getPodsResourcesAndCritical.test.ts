// a test that will retrieve all pods from the online-boutique namespace.
// The result must be an array with all the pods that are running in the namespace.
// get the resources
// scale the replica pods of the generator
// get the resources again
// get the resources that the pods have reached the limit of 80% CPU

// connect to the client
// deploy the app to the namespace
beforeAll(() => {
  console.log('setUp the app');
});

// disconnect from the client
// delete the app from the namespace
afterAll(() => {
  console.log('tearDown the app');
});

test('Calculator Tests', () => {
  console.log('we are ok');
});

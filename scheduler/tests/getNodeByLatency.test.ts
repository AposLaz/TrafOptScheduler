import { DUMMY_DATA } from './data/dummy/schedulerDummyData';
import { CN } from '../src/services/getCandidateNode';

describe('[UPSTREAM] - Get Candidate Node with the lowest latency', () => {
  test('Get the Node with the lowest latency where the pod is on a different node than the node with the highest rps ', () => {
    const node = CN.candidateNodeByLatency(
      DUMMY_DATA.criticalPods.singleRs[0].pods.node,
      DUMMY_DATA.upstreamPods,
      DUMMY_DATA.metricNodes,
      DUMMY_DATA.nodeLatency
    );

    expect(node).toEqual('node-1');
  });

  test('Get the Node with the lowest latency where the pod is within the node with the highest rps ', () => {
    DUMMY_DATA.criticalPods.singleRs[0].pods.node = 'node-1';

    const node = CN.candidateNodeByLatency(
      DUMMY_DATA.criticalPods.singleRs[0].pods.node,
      DUMMY_DATA.upstreamPods,
      DUMMY_DATA.metricNodes,
      DUMMY_DATA.nodeLatency
    );

    expect(node).toEqual('node-4');
  });
});

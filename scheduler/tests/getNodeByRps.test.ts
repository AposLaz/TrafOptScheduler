import { DUMMY_DATA } from './data/dummy/schedulerDummyData';
import { CN } from '../src/services/getCandidateNode';

describe('Nodes sorted byHighest RPS', () => {
  test('[UPSTREAM] => Get the nodes sorted by highest', () => {
    const nodes = CN.utils
      .nodeSumRps(DUMMY_DATA.upstreamPods)
      .sort((a, b) => b.rps - a.rps);

    expect(nodes[0]).toEqual({ node: 'node-1', rps: 120 });
    expect(nodes[1]).toEqual({ node: 'node-2', rps: 75 });
  });

  // TODO: implement
  test('[DOWNSTREAM] => Get the nodes sorted by highest', () => {});
});

describe('[UPSTREAM] - Get Candidate Node with Highest RPS', () => {
  test('Get the node with the highest RPS where pod is on a different node than the upstream highest rps', () => {
    const diff_node = CN.candidateNodeByRps(
      DUMMY_DATA.criticalPods.singleRs[0],
      DUMMY_DATA.upstreamPods
    );

    expect(diff_node).toEqual('node-1');
  });

  test('Get the node with the highest RPS where pod is on the same node than the upstream highest rps', () => {
    // Get the node with the highest RPS where pod is on the same node than the upstream highest rps
    DUMMY_DATA.criticalPods.singleRs[0].pods.node = 'node-1';

    const same_node = CN.candidateNodeByRps(
      DUMMY_DATA.criticalPods.singleRs[0],
      DUMMY_DATA.upstreamPods
    );

    expect(same_node).toEqual('node-2');
  });
});

// TODO: implement
describe('[DOWNSTREAM] - Get Candidate Node with Highest RPS', () => {});

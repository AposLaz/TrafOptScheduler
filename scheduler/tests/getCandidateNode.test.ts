import { DUMMY_DATA } from './data/schedulerDummyData';
import { CN } from '../src/services/getCandidateNode';

describe('Get Candidate Node', () => {
  describe('[UPSTREAM]', () => {
    test('By Highest Rps With Sufficient Resources', () => {
      // Get the node with the highest RPS where pod is on a different node than the upstream highest rps
      const diff_node = CN.getCandidateNodeWithHighestRps(
        DUMMY_DATA.criticalPods.singleRs[0],
        DUMMY_DATA.upstreamPods
      );

      expect(diff_node).toEqual('gke-cluster-1-pool-1-64bf1f88-trdd');

      // Get the node with the highest RPS where pod is on the same node than the upstream highest rps
      DUMMY_DATA.criticalPods.singleRs[0].pods.node =
        'gke-cluster-1-pool-1-64bf1f88-trdd';

      const same_node = CN.getCandidateNodeWithHighestRps(
        DUMMY_DATA.criticalPods.singleRs[0],
        DUMMY_DATA.upstreamPods
      );

      expect(same_node).toEqual('gke-cluster-1-pool-1-6fddd32a-bbq2');
    });
  });

  test('By Lowest Latency - ', () => {
    DUMMY_DATA.criticalPods.singleRs[0].pods.node =
      'gke-cluster-1-pool-1-6fddd32a-bbq2';

    const node = CN.getCandidateNodeWithLowestLatency(
      DUMMY_DATA.criticalPods.singleRs[0].pods.node,
      DUMMY_DATA.metricNodes,
      DUMMY_DATA.nodeLatency
    );

    console.log(node);
  });
});

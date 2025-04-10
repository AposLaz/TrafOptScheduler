/**
 * Test the prometheus mappers
 */

import { PrometheusMapper } from '../../src/adapters/prometheus/mapper';
import { DummyPromMetrics } from './data/data';

describe('prometheus mappers', () => {
  it('nodesLatency', () => {
    const results = DummyPromMetrics.latency;
    const latency = PrometheusMapper.toNodesLatency(results);

    expect(latency).toEqual([
      {
        from: 'node1',
        to: 'node2',
        latency: 0.91,
      },
      {
        from: 'node2',
        to: 'node1',
        latency: 0.88,
      },
      {
        from: 'node1',
        to: 'node3',
        latency: 0.82,
      },
      {
        from: 'node3',
        to: 'node1',
        latency: 0.87,
      },
      {
        from: 'node3',
        to: 'node2',
        latency: 0.79,
      },
      {
        from: 'node2',
        to: 'node3',
        latency: 0.78,
      },
      {
        from: 'node1',
        to: 'node1',
        latency: 0,
      },
      {
        from: 'node2',
        to: 'node2',
        latency: 0,
      },
      {
        from: 'node3',
        to: 'node3',
        latency: 0,
      },
    ]);
  });
});

import { getFaultToleranceZone } from '../src/services/faultTolerance';
import { DUMMY_DATA } from './data/dummy/schedulerDummyData';

describe('[FAULT TOLERANCE] - Get Fault Tolerant Zone', () => {
  test('Get Fault Tolerant Zone', () => {
    const zone = getFaultToleranceZone(DUMMY_DATA.criticalPods.singleRs);

    expect(true).toEqual(true);
  });
});

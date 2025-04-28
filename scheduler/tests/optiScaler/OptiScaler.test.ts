import fs from 'node:fs';
import * as fsSync from 'node:fs/promises';
import { constants } from 'node:fs';

import { MetricsType, SetupFolderFiles } from '../../src/enums';
import { setup } from '../../src/config/setup';
import { OptiScaler } from '../../src/core/optiScaler';
import { ScaleAction } from '../../src/core/optiScaler/enums';
import { DummyCluster } from './data/cluster';
import { DummyDeployments } from './data/deployment';
import { FileSystemHandler } from '../../src/adapters/filesystem';

const weights = {
  CPU: 0.5,
  Memory: 0.5,
};

beforeAll(async () => {
  // create the folder and the file for deployments
  await setup();
});

beforeEach(async () => {
  const filePath = `${SetupFolderFiles.DEFAULT_PATH}/${SetupFolderFiles.DEPLOYS_PATH}/${SetupFolderFiles.DEPLOYS_FILE}`;
  const fileExists = await fsSync
    .access(filePath, constants.F_OK)
    .then(() => true)
    .catch(() => false);

  if (!fileExists) {
    await setup();
  }

  await fsSync.writeFile(filePath, JSON.stringify([]));
});

afterAll(() => {
  // remove the filesystem
  fs.rmSync(SetupFolderFiles.DEFAULT_PATH, { recursive: true, force: true });
});

it('check setup of the file system', () => {
  const filePath = `${SetupFolderFiles.DEFAULT_PATH}/${SetupFolderFiles.DEPLOYS_PATH}/${SetupFolderFiles.DEPLOYS_FILE}`;

  expect(fs.existsSync(filePath)).toBe(true);
});

describe('filesystem setup scale up', () => {
  let optiScaler: OptiScaler;

  beforeEach(async () => {
    await setup();

    const fakeK8s = {
      createReplicaPodToSpecificNode: jest.fn().mockResolvedValue(undefined),
      removeReplicaPodToSpecificNode: jest.fn().mockResolvedValue(undefined),
    } as any;

    const fakeProm = {
      getUpstreamPodGraph: jest.fn(),
      getDownstreamPodGraph: jest.fn(),
    } as any;

    const dummyOptiData = {
      deployment: 'frontend',
      namespace: 'online-boutique',
      zonesNodes: {
        zoneA: { nodes: ['node1', 'node2', 'node3'] },
      },
      replicaPods: DummyDeployments['frontend'],
      nodeMetrics: DummyCluster.Nodes,
      nodesLatency: DummyCluster.NodesLatency,
    };

    optiScaler = new OptiScaler(ScaleAction.UP, dummyOptiData, {
      k8s: fakeK8s,
      prom: fakeProm,
      fileSystem: new FileSystemHandler(),
    });

    jest.spyOn(optiScaler, 'getFaultToleranceNodes').mockReturnValue(['node1', 'node2']);
    jest.spyOn(optiScaler, 'getCandidateNodeByGraph').mockResolvedValue('node1');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('check write data 2 times', async () => {
    const filePath = `${SetupFolderFiles.DEFAULT_PATH}/${SetupFolderFiles.DEPLOYS_PATH}/${SetupFolderFiles.DEPLOYS_FILE}`;

    await optiScaler.Execute(MetricsType.CPU, weights);

    await new Promise((resolve) => setTimeout(resolve, 500));

    // Read the file contents
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Parse JSON
    const jsonData = JSON.parse(fileContent);

    // Assert array of 1 element
    expect(Array.isArray(jsonData)).toBe(true);
    expect(jsonData.length).toBe(1);

    // Assert fields
    expect(jsonData[0]).toEqual({
      deployment: 'frontend',
      namespace: 'online-boutique',
      node: 'node1', // Because mocked getCandidateNodeByGraph return 'node1'
    });

    await optiScaler.Execute(MetricsType.CPU, weights);

    await new Promise((resolve) => setTimeout(resolve, 500));

    // Read the file contents
    const fileContent2 = fs.readFileSync(filePath, 'utf-8');

    // Parse JSON
    const jsonData2 = JSON.parse(fileContent2);

    // Assert array of 1 element
    expect(Array.isArray(jsonData2)).toBe(true);
    expect(jsonData2.length).toBe(2);

    // Assert fields
    expect(jsonData2[1]).toEqual({
      deployment: 'frontend',
      namespace: 'online-boutique',
      node: 'node1', // Because mocked getCandidateNodeByGraph return 'node1'
    });
  });
});

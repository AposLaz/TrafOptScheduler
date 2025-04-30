import fs from 'node:fs';
import * as fsSync from 'node:fs/promises';

import { FileSystemHandler } from '../../src/adapters/filesystem';
import { KubernetesAdapterImpl } from '../../src/adapters/k8s';
import { PrometheusAdapterImpl } from '../../src/adapters/prometheus';
import { setup } from '../../src/config/setup';
import { SetupFolderFiles } from '../../src/enums';

let k8s: KubernetesAdapterImpl;
let prometheus: PrometheusAdapterImpl;
let fileSystem = new FileSystemHandler();

beforeAll(async () => {
  k8s = new KubernetesAdapterImpl();
  prometheus = new PrometheusAdapterImpl();

  // create the folder and the file for deployments
  await setup();
});

beforeEach(async () => {
  const filePath = `${SetupFolderFiles.DEFAULT_PATH}/${SetupFolderFiles.DEPLOYS_PATH}/${SetupFolderFiles.DEPLOYS_FILE}`;
  const fileExists = await fsSync
    .access(filePath, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false);

  if (!fileExists) {
    await setup();
  }

  await fsSync.writeFile(
    filePath,
    JSON.stringify([
      {
        deployment: 'loadgenerator',
        namespace: 'online-boutique',
      },
      {
        deployment: 'loadgenerator',
        namespace: 'online-boutique',
      },
      {
        deployment: 'loadgenerator',
        namespace: 'online-boutique',
      },
      {
        deployment: 'loadgenerator',
        namespace: 'online-boutique',
      },
      {
        deployment: 'frontend',
        namespace: 'online-boutique',
      },
      {
        deployment: 'checkoutservice',
        namespace: 'online-boutique',
      },
    ])
  );
});

afterAll(() => {
  // remove the filesystem
  // fs.rmSync(SetupFolderFiles.DEFAULT_PATH, { recursive: true, force: true });
});

describe('OptiBalancer => applyOptiBalancerForWrittenData', () => {
  it('should skip unhealthy deployments', () => {
    jest
      .spyOn(k8s, 'checkDeploymentHealthy')
      .mockImplementationOnce(async () => false) // 1st deployment: unhealthy
      .mockImplementationOnce(async () => true) // 2nd deployment: healthy
      .mockImplementationOnce(async () => true); // 3rd deployment: healthy

    jest
      .spyOn(prometheus, 'getDownstreamPodGraph')
      .mockImplementationOnce(async () => [
        {
          node: 'node2',
          destinations: [
            {
              rps: 0.1111111111111111,
              node: 'node2',
              pod: 'checkoutservice-694758bddf-qm76n',
              source_workload: 'frontend',
              source_version: 'unknown',
              source_workload_namespace: 'online-boutique',
              destination_service_name: 'checkoutservice',
              destination_service_namespace: 'online-boutique',
              destination_version: 'unknown',
              destination_workload: 'checkoutservice',
            },
          ],
        },
        {
          node: 'node1',
          destinations: [
            {
              rps: 17.466666666666665,
              node: 'node1',
              pod: 'currencyservice-75d6599b9-7rhfg',
              source_workload: 'frontend',
              source_version: 'unknown',
              source_workload_namespace: 'online-boutique',
              destination_service_name: 'currencyservice',
              destination_service_namespace: 'online-boutique',
              destination_version: 'unknown',
              destination_workload: 'currencyservice',
            },
            {
              rps: 1.0666666666666664,
              node: 'node1',
              pod: 'shippingservice-85ddd6cdbc-ml9hv',
              source_workload: 'frontend',
              source_version: 'unknown',
              source_workload_namespace: 'online-boutique',
              destination_service_name: 'shippingservice',
              destination_service_namespace: 'online-boutique',
              destination_version: 'unknown',
              destination_workload: 'shippingservice',
            },
            {
              rps: 3.333333333333333,
              node: 'node1',
              pod: 'recommendationservice-75b8b64bdc-77jsk',
              source_workload: 'frontend',
              source_version: 'unknown',
              source_workload_namespace: 'online-boutique',
              destination_service_name: 'recommendationservice',
              destination_service_namespace: 'online-boutique',
              destination_version: 'unknown',
              destination_workload: 'recommendationservice',
            },
            {
              rps: 4.377777777777777,
              node: 'node1',
              pod: 'cartservice-6f4fc7c4c4-qhn9l',
              source_workload: 'frontend',
              source_version: 'unknown',
              source_workload_namespace: 'online-boutique',
              destination_service_name: 'cartservice',
              destination_service_namespace: 'online-boutique',
              destination_version: 'unknown',
              destination_workload: 'cartservice',
            },
          ],
        },
        {
          node: 'node3',
          destinations: [
            {
              rps: 3.0222222222222217,
              node: 'node3',
              pod: 'adservice-7fd58465b7-cx9jz',
              source_workload: 'frontend',
              source_version: 'unknown',
              source_workload_namespace: 'online-boutique',
              destination_service_name: 'adservice',
              destination_service_namespace: 'online-boutique',
              destination_version: 'unknown',
              destination_workload: 'adservice',
            },
            {
              rps: 22.111111111111107,
              node: 'node3',
              pod: 'productcatalogservice-54cf845bc5-6xzs2',
              source_workload: 'frontend',
              source_version: 'unknown',
              source_workload_namespace: 'online-boutique',
              destination_service_name: 'productcatalogservice',
              destination_service_namespace: 'online-boutique',
              destination_version: 'unknown',
              destination_workload: 'productcatalogservice',
            },
          ],
        },
      ])
      .mockImplementationOnce(async () => [
        {
          node: 'node1',
          destinations: [
            {
              rps: 0.39999999999999997,
              node: 'node1',
              pod: 'currencyservice-75d6599b9-7rhfg',
              source_workload: 'checkoutservice',
              source_version: 'unknown',
              source_workload_namespace: 'online-boutique',
              destination_service_name: 'currencyservice',
              destination_service_namespace: 'online-boutique',
              destination_version: 'unknown',
              destination_workload: 'currencyservice',
            },
            {
              rps: 0.2222222222222222,
              node: 'node1',
              pod: 'shippingservice-85ddd6cdbc-ml9hv',
              source_workload: 'checkoutservice',
              source_version: 'unknown',
              source_workload_namespace: 'online-boutique',
              destination_service_name: 'shippingservice',
              destination_service_namespace: 'online-boutique',
              destination_version: 'unknown',
              destination_workload: 'shippingservice',
            },
            {
              rps: 0.1111111111111111,
              node: 'node1',
              pod: 'paymentservice-7d969fdc57-7nw9l',
              source_workload: 'checkoutservice',
              source_version: 'unknown',
              source_workload_namespace: 'online-boutique',
              destination_service_name: 'paymentservice',
              destination_service_namespace: 'online-boutique',
              destination_version: 'unknown',
              destination_workload: 'paymentservice',
            },
            {
              rps: 0.1111111111111111,
              node: 'node1',
              pod: 'emailservice-b964694b9-ck5sc',
              source_workload: 'checkoutservice',
              source_version: 'unknown',
              source_workload_namespace: 'online-boutique',
              destination_service_name: 'emailservice',
              destination_service_namespace: 'online-boutique',
              destination_version: 'unknown',
              destination_workload: 'emailservice',
            },
            {
              rps: 0.2222222222222222,
              node: 'node1',
              pod: 'cartservice-6f4fc7c4c4-qhn9l',
              source_workload: 'checkoutservice',
              source_version: 'unknown',
              source_workload_namespace: 'online-boutique',
              destination_service_name: 'cartservice',
              destination_service_namespace: 'online-boutique',
              destination_version: 'unknown',
              destination_workload: 'cartservice',
            },
          ],
        },
        {
          node: 'node3',
          destinations: [
            {
              rps: 0.28888888888888886,
              node: 'node3',
              pod: 'productcatalogservice-54cf845bc5-6xzs2',
              source_workload: 'checkoutservice',
              source_version: 'unknown',
              source_workload_namespace: 'online-boutique',
              destination_service_name: 'productcatalogservice',
              destination_service_namespace: 'online-boutique',
              destination_version: 'unknown',
              destination_workload: 'productcatalogservice',
            },
          ],
        },
      ]);
  });
});

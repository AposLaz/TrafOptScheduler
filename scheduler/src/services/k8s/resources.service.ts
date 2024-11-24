import * as k8s from '@kubernetes/client-node';
import { readYamlK8sFilesFromPath } from '../../common/helpers';
import { K8sClientApiFactory } from '../../config/k8sClient';
import { K8sClientTypeApi } from '../../enums';
import { logger } from '../../config/logger';

export class ResourceService {
  private client: k8s.KubernetesObjectApi;

  constructor(client: k8s.KubernetesObjectApi) {
    this.client = client;
  }

  async apply(
    resources: k8s.KubernetesObject[]
  ): Promise<k8s.KubernetesObject[]> {
    const created: string[] = [];
    const notCreated: k8s.KubernetesObject[] = [];

    for (const resource of resources) {
      try {
        if (!resource.metadata || !resource.metadata.name) {
          logger.error(
            `Failed to apply resource: ${resource}. Metadata or name is undefined`
          );
          notCreated.push(resource);
          continue;
        }

        // This is to convince the old version of TypeScript that metadata exists even though we already filtered specs
        // without metadata out
        resource.metadata.annotations = resource.metadata.annotations || {};
        delete resource.metadata.annotations[
          'kubectl.kubernetes.io/last-applied-configuration'
        ];
        resource.metadata.annotations[
          'kubectl.kubernetes.io/last-applied-configuration'
        ] = JSON.stringify(resource);

        // Construct a valid resource header
        const resourceHeader = {
          apiVersion: resource.apiVersion,
          kind: resource.kind,
          metadata: {
            name: resource.metadata.name,
            namespace: resource.metadata.namespace || 'default',
          },
        };

        // Check if the resource exists
        await this.client.read(resourceHeader);

        // Resource exists, patch it
        const response = await this.client.patch(resource);
        created.push(`${response.body.metadata!.name!}:${response.body.kind}`);
      } catch (error) {
        const err = error as k8s.HttpError;
        if (err.body.code === 404) {
          // If resource does not exist, create it
          const response = await this.client.create(resource);
          created.push(
            `${response.body.metadata!.name!}:${response.body.kind}`
          );
        } else {
          logger.error(`Error creating resource: ${resource} / ${err.message}`);
          notCreated.push(resource);
        }
      }
    }

    logger.info(
      `All resources created/updated: ${created.join(', ')} / ${notCreated.length} not created because metadata name is undefined`
    );
    return notCreated;
  }

  /**
   * Replicate the functionality of `kubectl apply`.  That is, create the resources defined in the `specFile` if they do
   * not exist, patch them if they do exist.
   *
   * @param specPath File system path to a YAML Kubernetes spec.
   * @return Array of resources created
   */

  async applyFromFile(specPath: string): Promise<k8s.KubernetesObject[]> {
    const yamlFiles = readYamlK8sFilesFromPath(specPath);

    const flatYamlFiles = Object.values(yamlFiles).flat();

    const resources = await this.apply(flatYamlFiles);
    return resources;
  }
}

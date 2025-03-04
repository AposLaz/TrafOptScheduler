import { readYamlK8sFilesFromPath } from '../../../common/helpers';
import { logger } from '../../../config/logger';

import type * as k8s from '@kubernetes/client-node';

export class ResourceService {
  private client: k8s.KubernetesObjectApi;
  private customClient: k8s.CustomObjectsApi;

  constructor(client: k8s.KubernetesObjectApi, customClient: k8s.CustomObjectsApi) {
    this.client = client;
    this.customClient = customClient;
  }

  async apply(resources: k8s.KubernetesObject[]): Promise<k8s.KubernetesObject[]> {
    const created: string[] = [];
    const notCreated: k8s.KubernetesObject[] = [];

    for (const resource of resources) {
      try {
        if (!resource.metadata || !resource.metadata.name) {
          logger.error(`Failed to apply resource: ${resource}. Metadata or name is undefined`);
          notCreated.push(resource);
          continue;
        }

        // This is to convince the old version of TypeScript that metadata exists even though we already filtered specs
        // without metadata out
        resource.metadata.annotations = resource.metadata.annotations || {};
        delete resource.metadata.annotations['kubectl.kubernetes.io/last-applied-configuration'];
        resource.metadata.annotations['kubectl.kubernetes.io/last-applied-configuration'] = JSON.stringify(resource);

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
      } catch (error: unknown) {
        const err = error as k8s.HttpError;
        if (err.body.code === 404) {
          // If resource does not exist, create it
          const response = await this.client.create(resource);
          created.push(`${response.body.metadata!.name!}:${response.body.kind}`);
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

  async applyCustomObject(resource: k8s.KubernetesObject): Promise<void> {
    try {
      if (!resource.metadata || !resource.metadata.name) {
        throw new Error(`Resource metadata or name is missing: ${JSON.stringify(resource)}`);
      }

      // Extract API information
      const [group, version] = resource.apiVersion ? resource.apiVersion.split('/') : ['', ''];
      const kind = resource.kind || '';
      const namespace = resource.metadata.namespace || 'default';
      const name = resource.metadata.name;
      const plural = this.getPluralName(kind); // Get the plural form for CRD

      // Ensure annotations are properly set
      resource.metadata.annotations = resource.metadata.annotations || {};
      delete resource.metadata.annotations['kubectl.kubernetes.io/last-applied-configuration'];
      resource.metadata.annotations['kubectl.kubernetes.io/last-applied-configuration'] = JSON.stringify(resource);

      try {
        await this.customClient.getNamespacedCustomObject(group, version, namespace, plural, name);

        const response = await this.customClient.patchNamespacedCustomObject(
          group,
          version,
          namespace,
          plural,
          name,
          resource,
          undefined,
          undefined,
          undefined,
          { headers: { 'Content-Type': 'application/merge-patch+json' } }
        );
        logger.info(`Custom Object updated: ${JSON.stringify(response.body, null, 2)}`);
      } catch (error: unknown) {
        const err = error as k8s.HttpError;
        if (err.response && err.response.statusCode === 404) {
          // Step 3: If not found, CREATE the resource
          const response = await this.customClient.createNamespacedCustomObject(
            group,
            version,
            namespace,
            plural,
            resource
          );
          logger.info(`Custom Object created: ${response.body}`);
        } else {
          logger.error(`Error applying Custom Object: ${JSON.stringify(resource, null, 2)} - ${err.message}`);
        }
      }
    } catch (error) {
      logger.error(`Failed to apply Custom Object: ${error}`);
    }
  }

  // Utility function to get the plural name of the Custom Resource
  private getPluralName(kind: string): string {
    return kind.toLowerCase() + 's'; // Basic pluralization logic
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs';
import path from 'path';

import yaml from 'js-yaml';

import type * as k8s from '@kubernetes/client-node';

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const convertResourcesStringToNumber = (resource: string) => {
  return parseInt(resource.replace(/\D/g, ''), 10);
};

export const readDataFromFile = (filePath: string) => {
  const fileData = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(fileData);
  return data;
};

/**
 * Reads Kubernetes YAML specs from a specified path, which can be either a file or a directory.
 * @param specPath - The path to the file or directory containing Kubernetes YAML specifications.
 * @returns A map where keys are filenames and values are arrays of Kubernetes objects parsed from the YAML files.
 */
export const readYamlK8sFilesFromPath = (
  specPath: string
): { [key: string]: k8s.KubernetesObject[] } => {
  // Initialize an empty object to store the YAML data.
  const yamlData: { [key: string]: k8s.KubernetesObject[] } = {};

  // Check if the given path is a file.
  if (fs.lstatSync(specPath).isFile()) {
    // Read the file content as a UTF-8 string.
    const fileData = fs.readFileSync(specPath, 'utf8');
    // Parse all YAML documents in the file.
    const yamlFile = yaml.loadAll(fileData) as any[];
    // Filter and store the parsed YAML objects that have both 'kind' and 'metadata' fields.
    yamlData[path.basename(specPath)] = yamlFile.filter(
      (spec) => spec && spec.kind && spec.metadata
    );
  } else {
    // If the path is a directory, read all files in the directory.
    const fileList = fs.readdirSync(specPath);
    // Filter for files with .yaml or .yml extensions.
    const yamlFiles = fileList.filter(
      (file) => file.endsWith('.yaml') || file.endsWith('.yml')
    );

    // Process each YAML file found in the directory.
    yamlFiles.forEach((fileName: string) => {
      // Construct the full path to the file.
      const filePath = path.join(specPath, fileName);
      // Read the current file content as a UTF-8 string.
      const fileData = fs.readFileSync(filePath, 'utf8');
      // Parse all YAML documents in the current file.
      const yamlFile = yaml.loadAll(fileData) as any[];
      // Filter and store the parsed YAML objects that have both 'kind' and 'metadata' fields.
      yamlData[fileName] = yamlFile.filter(
        (spec) => spec && spec.kind && spec.metadata
      );
    });
  }

  // Return the map of filenames to their corresponding Kubernetes objects.
  return yamlData;
};

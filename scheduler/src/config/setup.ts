import { loggerStartApp } from './logger.js';
import { FileSystemHandler } from '../adapters/filesystem/index.js';

const fileHandler = new FileSystemHandler();

export const setup = async () => {
  // start the app logger
  loggerStartApp();
  // create the base folder path
  await fileHandler.createMountPath();
  await fileHandler.createFile();
};

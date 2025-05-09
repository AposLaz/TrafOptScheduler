import { loggerStartApp } from './logger.ts';
import { FileSystemHandler } from '../adapters/filesystem/index.ts';

const fileHandler = new FileSystemHandler();

export const setup = async () => {
  // start the app logger
  loggerStartApp();
  // create the base folder path
  await fileHandler.createMountPath();
  await fileHandler.createFile();
};

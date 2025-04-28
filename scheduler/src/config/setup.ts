import { loggerStartApp } from './logger';
import { FileSystemHandler } from '../adapters/filesystem';

const fileHandler = new FileSystemHandler();

export const setup = async () => {
  // start the app logger
  loggerStartApp();
  // create the base folder path
  await fileHandler.createMountPath();
  await fileHandler.createFile();
};

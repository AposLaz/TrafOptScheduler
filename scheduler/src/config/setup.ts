import { loggerStartApp } from './logger';
import { FileSystemHandler } from '../adapters/filesystem';

const fileHandler = new FileSystemHandler();

const setup = () => {
  // start the app logger
  loggerStartApp();
  // create the base folder path
  fileHandler.createMountPath();
  fileHandler.createFile();
};

setup();

import { FileSystemHandler } from '../adapters/filesystem';
import { loggerStartApp } from './logger';

const fileHandler = new FileSystemHandler();

const setup = () => {
  // start the app logger
  loggerStartApp();
  // create the base folder path
  fileHandler.createMountPath();
  fileHandler.createFile();
};

setup();

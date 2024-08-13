import fs from 'node:fs';
import { SetupFolderFiles } from '../enums';
import { logger } from './logger';

// on app startup create the path data/notReadyPods and the empty file deployQueue.json in the file system
const createMountPath = () => {
  const queuePath = `${SetupFolderFiles.DEFAULT_PATH}/${SetupFolderFiles.QUEUE_PATH}`;
  // create mount path
  try {
    if (!fs.existsSync(queuePath)) {
      fs.mkdirSync(queuePath, { recursive: true });
      logger.info(`Created required directories [${queuePath}] successfully.`);
    }
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(err.message);
    throw new Error(
      `Unable to create required directories [${queuePath}], please check permissions.`
    );
  }
};

const createQueueFile = () => {
  const queueFile = `${SetupFolderFiles.DEFAULT_PATH}/${SetupFolderFiles.QUEUE_PATH}/${SetupFolderFiles.QUEUE_FILE}`;
  try {
    if (!fs.existsSync(queueFile)) {
      fs.writeFileSync(queueFile, '[]', { flag: 'w' });
      logger.info(`Created required file [${queueFile}] successfully.`);
    }
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(err.message);
    throw new Error(
      `Unable to create required file [${queueFile}], please check permissions..`
    );
  }
};

const setup = () => {
  // create the base folder path
  createMountPath();
  createQueueFile();
};

setup();

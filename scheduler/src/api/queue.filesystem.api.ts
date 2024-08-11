// if a deployment is not in a ready state store it in a file system
// store all of them in a filesystem under path /data/notReadyPods/deployQueue.json
import fs from 'node:fs';
import { SetupFolderFiles } from '../enums';
import { DeploymentNotReadyFilesystem } from '../types';
import { logger } from '../config/logger';
import { raceConditions } from '../handler/conc.raceConditions';

class QueueFileSystemHandlerApi {
  // store deploy to filesystem queue
  writeDeployToQueueFile = (deploy: DeploymentNotReadyFilesystem) => {
    const queueFile = `${SetupFolderFiles.DEFAULT_PATH}/${SetupFolderFiles.QUEUE_PATH}/${SetupFolderFiles.QUEUE_FILE}`;
    try {
      // lock file system writes until write complete
      raceConditions.acquireLock();
      // read data from the file
      const data = this.readQueueFile();

      // decode json data to the right format
      const queue: DeploymentNotReadyFilesystem[] = JSON.parse(data);

      queue.push(deploy);

      //write data to the filesystem
      fs.writeFileSync(queueFile, JSON.stringify(queue, null, 2), {
        flag: 'w',
      });
      logger.info(`Write content to file [${queueFile}], successfully.`);
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(err.message);
      throw new Error(
        `[ERROR] Unable to write to file [${queueFile}], please check if the file exists and has the correct permissions.`
      );
    } finally {
      // unlock file system writes
      raceConditions.releaseLock();
    }
  };

  // loadDeployments from the filesystem
  readQueueFile = () => {
    const queueFile = `${SetupFolderFiles.DEFAULT_PATH}/${SetupFolderFiles.QUEUE_PATH}/${SetupFolderFiles.QUEUE_FILE}`;
    try {
      const data = fs.readFileSync(queueFile, 'utf8');
      logger.info(`Read content from file [${queueFile}], successfully.`);
      return data;
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(err.message);
      throw new Error(
        `[ERROR] Unable to read file [${queueFile}], please check if the file exists and has the correct permissions.`
      );
    }
  };

  // delete deploy from filesystem queue
  deleteDeployFromQueueFile = (deploy: DeploymentNotReadyFilesystem) => {
    const queueFile = `${SetupFolderFiles.DEFAULT_PATH}/${SetupFolderFiles.QUEUE_PATH}/${SetupFolderFiles.QUEUE_FILE}`;
    try {
      // lock file system writes until delete complete
      raceConditions.acquireLock();
      // read data from the file
      const data = this.readQueueFile();

      // decode json data to the right format
      const queue: DeploymentNotReadyFilesystem[] = JSON.parse(data);

      // delete specific deployment from the file and after that write it back
      const appendQueue = queue.filter(
        (item) => item.deploymentName !== deploy.deploymentName
      );

      //write data to the filesystem
      fs.writeFileSync(queueFile, JSON.stringify(appendQueue, null, 2), {
        flag: 'w',
      });
      logger.info(`Delete content to file [${queueFile}], successfully.`);
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(err.message);
      throw new Error(
        `[ERROR] Unable to delete to file [${queueFile}], please check if the file exists and has the correct permissions.`
      );
    } finally {
      // unlock file system delete
      raceConditions.releaseLock();
    }
  };
}

export const queueApi = new QueueFileSystemHandlerApi();

import fs from 'node:fs';

import { SetupFolderFiles } from '../enums';

const LOCK_FILE = `${SetupFolderFiles.DEFAULT_PATH}/${SetupFolderFiles.QUEUE_PATH}/.queue.lock`;

export const raceConditions = {
  acquireLock: () => {
    while (fs.existsSync(LOCK_FILE)) {
      // Wait for lock to be released
      // This is a simple busy-wait loop, consider adding a delay for better performance
    }
    fs.writeFileSync(LOCK_FILE, 'locked');
  },
  releaseLock: () => {
    fs.unlinkSync(LOCK_FILE);
  },
};

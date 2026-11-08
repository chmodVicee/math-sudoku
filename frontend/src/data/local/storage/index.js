import { Capacitor } from '@capacitor/core';
import { webStorage } from './webStorage';

let storagePromise = null;

export async function getStorage() {
  if (!storagePromise) {
    storagePromise = (async () => {
      if (Capacitor.isNativePlatform()) {
        const { sqliteStorage } = await import('./sqliteStorage');
        await sqliteStorage.init();
        return sqliteStorage;
      }
      await webStorage.init();
      return webStorage;
    })();
  }
  return storagePromise;
}

import { Capacitor } from '@capacitor/core';

/**
 * La app web habla con el backend Spring Boot. La app Android funciona
 * offline-first con generación y persistencia locales.
 *
 * VITE_LOCAL_MODE=1 permite probar el modo local en el navegador durante
 * el desarrollo (sin emulador Android).
 */
export function isNativePlatform() {
  return Capacitor.isNativePlatform();
}

export function useLocalData() {
  return isNativePlatform() || import.meta.env.VITE_LOCAL_MODE === '1';
}

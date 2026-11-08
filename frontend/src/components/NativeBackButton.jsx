import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { isNativePlatform } from '../platform';

/**
 * En Android, el botón físico "atrás" debe navegar dentro de la app y solo
 * cerrarla cuando el usuario ya está en la pantalla principal.
 */
export default function NativeBackButton() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isNativePlatform()) return undefined;

    let listener;
    CapacitorApp.addListener('backButton', () => {
      const path = window.location.pathname;
      if (path === '/' || path === '/login' || path === '/registro') {
        CapacitorApp.exitApp();
        return;
      }
      navigate(-1);
    }).then((handle) => {
      listener = handle;
    });

    return () => {
      listener?.remove();
    };
  }, [navigate]);

  return null;
}

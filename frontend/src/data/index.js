import { useLocalData } from '../platform';
import { localData } from './local/localData';
import { webData } from './webData';

/**
 * Punto único de acceso a datos. La app web usa el backend; la app Android
 * usa SQLite y el generador local.
 */
export const data = useLocalData() ? localData : webData;

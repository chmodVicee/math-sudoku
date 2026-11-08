import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { data } from '../data';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    data.auth
      .me()
      .then((currentUser) => setUser(currentUser ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleExpired = () => {
      data.auth.logout();
      setUser(null);
    };
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  const login = useCallback(async (credentials) => {
    const currentUser = await data.auth.login(credentials);
    setUser(currentUser);
    return currentUser;
  }, []);

  const register = useCallback(async (credentials) => {
    const currentUser = await data.auth.register(credentials);
    setUser(currentUser);
    return currentUser;
  }, []);

  const logout = useCallback(async () => {
    await data.auth.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}

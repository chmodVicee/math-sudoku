import { api, clearToken, setToken } from '../api';

/**
 * Implementación web: habla con la API Spring Boot y guarda el JWT.
 */
export const webData = {
  auth: {
    async login(credentials) {
      const response = await api('/auth/login', {
        method: 'POST',
        body: credentials,
        auth: false,
      });
      setToken(response.token);
      return response.user;
    },

    async register(credentials) {
      const response = await api('/auth/register', {
        method: 'POST',
        body: credentials,
        auth: false,
      });
      setToken(response.token);
      return response.user;
    },

    async me() {
      return api('/auth/me');
    },

    async logout() {
      clearToken();
    },
  },

  progress: {
    async get() {
      return api('/progress');
    },
  },

  game: {
    async getLevel(level) {
      return api(`/game/levels/${level}`);
    },

    async completeLevel(level, request) {
      return api(`/game/levels/${level}/complete`, {
        method: 'POST',
        body: request,
      });
    },
  },
};

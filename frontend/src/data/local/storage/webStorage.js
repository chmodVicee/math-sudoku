/**
 * Almacenamiento local para el modo offline en navegador (desarrollo/pruebas).
 * En Android se usa SQLite; esta implementación mantiene la misma interfaz.
 */
const STORAGE_KEY = 'mathsudoku.localStore.v1';

function emptyState() {
  return {
    users: [],
    progress: [],
    levelResults: [],
    nextUserId: 1,
    nextResultId: 1,
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    return {
      ...emptyState(),
      ...parsed,
      users: parsed.users ?? [],
      progress: parsed.progress ?? [],
      levelResults: parsed.levelResults ?? [],
    };
  } catch {
    return emptyState();
  }
}

function save(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function clone(value) {
  return value === null || value === undefined ? value : structuredClone(value);
}

export const webStorage = {
  async init() {
    load();
  },

  async getUserByUsername(username) {
    const state = load();
    const normalized = username.trim().toLowerCase();
    return clone(
      state.users.find((user) => user.username.toLowerCase() === normalized) ?? null,
    );
  },

  async getUserById(id) {
    const state = load();
    return clone(state.users.find((user) => user.id === id) ?? null);
  },

  async insertUser(user) {
    const state = load();
    const created = { ...user, id: state.nextUserId };
    state.nextUserId += 1;
    state.users.push(created);
    save(state);
    return clone(created);
  },

  async updateUser(user) {
    const state = load();
    state.users = state.users.map((item) => (item.id === user.id ? { ...item, ...user } : item));
    save(state);
    return clone(user);
  },

  async getProgress(userId) {
    const state = load();
    return clone(state.progress.find((item) => item.userId === userId) ?? null);
  },

  async insertProgress(progress) {
    const state = load();
    state.progress = state.progress.filter((item) => item.userId !== progress.userId);
    state.progress.push({ ...progress });
    save(state);
    return clone(progress);
  },

  async updateProgress(progress) {
    return this.insertProgress(progress);
  },

  async getLevelResults(userId) {
    const state = load();
    return clone(
      state.levelResults
        .filter((item) => item.userId === userId)
        .sort((a, b) => a.level - b.level),
    );
  },

  async getLevelResult(userId, level) {
    const state = load();
    return clone(
      state.levelResults.find((item) => item.userId === userId && item.level === level) ?? null,
    );
  },

  async insertLevelResult(result) {
    const state = load();
    const created = { ...result, id: state.nextResultId };
    state.nextResultId += 1;
    state.levelResults.push(created);
    save(state);
    return clone(created);
  },

  async updateLevelResult(result) {
    const state = load();
    state.levelResults = state.levelResults.map((item) =>
      (item.id === result.id ? { ...item, ...result } : item),
    );
    save(state);
    return clone(result);
  },
};

import { MAX_LEVEL, generateLevel } from '../../game/levelGenerator';
import { createPasswordHash, verifyPassword } from './password';
import { getStorage } from './storage';

const SESSION_KEY = 'mathsudoku.localSessionUserId';
const MAX_SEED = 4_503_599_627_370_495; // 2^52 - 1 (el backend acepta semillas < 2^52)
const MAX_LEVEL_TIME_SECONDS = 86_400;

function apiError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function nowIso() {
  return new Date().toISOString();
}

function readSessionUserId() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isInteger(parsed) ? parsed : null;
}

function writeSessionUserId(userId) {
  localStorage.setItem(SESSION_KEY, String(userId));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function publicUser(user) {
  return { id: user.id, username: user.username };
}

function validateRegistration(username, password) {
  const trimmed = username.trim();
  if (trimmed.length < 3 || trimmed.length > 30) {
    throw apiError('El nombre de usuario debe tener entre 3 y 30 caracteres', 400);
  }
  if (!/^[A-Za-z0-9_]+$/.test(trimmed)) {
    throw apiError('Solo se permiten letras, números y guion bajo', 400);
  }
  if (password.length < 6 || password.length > 100) {
    throw apiError('La contraseña debe tener al menos 6 caracteres', 400);
  }
  return trimmed;
}

async function requireUser() {
  const storage = await getStorage();
  const userId = readSessionUserId();
  if (!userId) throw apiError('No hay una sesión activa', 401);
  const user = await storage.getUserById(userId);
  if (!user) {
    clearSession();
    throw apiError('No hay una sesión activa', 401);
  }
  return user;
}

async function requireProgress(userId) {
  const storage = await getStorage();
  let progress = await storage.getProgress(userId);
  if (!progress) {
    progress = {
      userId,
      currentLevel: 1,
      highestLevel: 1,
      totalLevelsCompleted: 0,
      totalTimeSeconds: 0,
      updatedAt: nowIso(),
      syncStatus: 'pending',
    };
    await storage.insertProgress(progress);
  }
  return progress;
}

function toProgressResponse(progress, results) {
  return {
    currentLevel: progress.currentLevel,
    highestLevel: progress.highestLevel,
    totalLevelsCompleted: progress.totalLevelsCompleted,
    totalTimeSeconds: progress.totalTimeSeconds,
    bestTimes: results
      .slice()
      .sort((a, b) => a.level - b.level)
      .map((result) => ({
        level: result.level,
        bestSeconds: result.bestSeconds,
        attempts: result.attempts,
        lastPlayedAt: result.lastPlayedAt,
      })),
  };
}

function randomSeed() {
  if (globalThis.crypto?.getRandomValues) {
    const buffer = new Uint32Array(2);
    globalThis.crypto.getRandomValues(buffer);
    const value = (BigInt(buffer[0]) << 21n) | BigInt(buffer[1] & 0x1fffff);
    return Number(value % BigInt(MAX_SEED)) + 1;
  }
  return Math.floor(Math.random() * MAX_SEED) + 1;
}

function assertUnlocked(level, progress) {
  if (!Number.isInteger(level) || level < 1 || level > MAX_LEVEL) {
    throw apiError('Número de nivel inválido', 400);
  }
  if (level > progress.currentLevel) {
    throw apiError('Todavía no has desbloqueado este nivel', 409);
  }
}

function toLevelResponse(generated) {
  const emptyCount = generated.cells.filter((cell) => !cell.given).length;
  return {
    level: generated.level,
    size: generated.size,
    seed: generated.seed,
    givenCount: generated.givenCount,
    emptyCount,
    cells: generated.cells.map((cell) => ({
      id: cell.id,
      row: cell.row,
      col: cell.col,
      expression: cell.expression,
      value: cell.given ? cell.value : null,
      given: cell.given,
    })),
    options: generated.options,
  };
}

async function recordCompletion(userId, level, elapsedSeconds) {
  const storage = await getStorage();
  const progress = await requireProgress(userId);
  const safeElapsed = Math.max(1, Math.min(elapsedSeconds, MAX_LEVEL_TIME_SECONDS));
  const timestamp = nowIso();

  let result = await storage.getLevelResult(userId, level);
  const firstCompletion = result === null;
  let newBest = firstCompletion;

  if (result === null) {
    result = {
      userId,
      level,
      bestSeconds: safeElapsed,
      attempts: 1,
      lastPlayedAt: timestamp,
      syncStatus: 'pending',
    };
    result = await storage.insertLevelResult(result);
  } else {
    newBest = safeElapsed < result.bestSeconds;
    result = {
      ...result,
      bestSeconds: newBest ? safeElapsed : result.bestSeconds,
      attempts: result.attempts + 1,
      lastPlayedAt: timestamp,
      syncStatus: 'pending',
    };
    await storage.updateLevelResult(result);
  }

  if (firstCompletion) {
    progress.totalLevelsCompleted += 1;
  }
  progress.totalTimeSeconds += safeElapsed;
  if (level === progress.currentLevel) {
    progress.currentLevel = level + 1;
    progress.highestLevel = Math.max(progress.highestLevel, progress.currentLevel);
  }
  progress.updatedAt = timestamp;
  progress.syncStatus = 'pending';
  await storage.updateProgress(progress);

  const results = await storage.getLevelResults(userId);
  return {
    solved: true,
    wrongCells: [],
    elapsedSeconds: safeElapsed,
    newBest,
    progress: toProgressResponse(progress, results),
    message: '¡Nivel completado!',
  };
}

export const localData = {
  auth: {
    async register({ username, password }) {
      const storage = await getStorage();
      const trimmed = validateRegistration(username, password);

      if (await storage.getUserByUsername(trimmed)) {
        throw apiError('Ese nombre de usuario ya está en uso', 409);
      }

      const { hash, salt } = await createPasswordHash(password);
      const user = await storage.insertUser({
        username: trimmed,
        passwordHash: hash,
        passwordSalt: salt,
        createdAt: nowIso(),
        remoteId: null,
        syncStatus: 'pending',
      });

      await requireProgress(user.id);
      writeSessionUserId(user.id);
      return publicUser(user);
    },

    async login({ username, password }) {
      const storage = await getStorage();
      const user = await storage.getUserByUsername(username);

      if (!user || !(await verifyPassword(password, user.passwordHash, user.passwordSalt))) {
        throw apiError('Usuario o contraseña incorrectos', 401);
      }

      writeSessionUserId(user.id);
      return publicUser(user);
    },

    async me() {
      const storage = await getStorage();
      const userId = readSessionUserId();
      if (!userId) return null;
      const user = await storage.getUserById(userId);
      if (!user) {
        clearSession();
        return null;
      }
      return publicUser(user);
    },

    async logout() {
      clearSession();
    },
  },

  progress: {
    async get() {
      const user = await requireUser();
      const storage = await getStorage();
      const progress = await requireProgress(user.id);
      const results = await storage.getLevelResults(user.id);
      return toProgressResponse(progress, results);
    },
  },

  game: {
    async getLevel(level) {
      const user = await requireUser();
      const progress = await requireProgress(user.id);
      assertUnlocked(level, progress);

      const seed = randomSeed();
      return toLevelResponse(generateLevel(level, seed));
    },

    async completeLevel(level, request) {
      const user = await requireUser();
      const progress = await requireProgress(user.id);

      if (!Number.isInteger(request.seed) || request.seed < 1 || request.seed >= MAX_SEED + 1) {
        throw apiError('Semilla inválida', 400);
      }
      assertUnlocked(level, progress);

      const generated = generateLevel(level, request.seed);
      const solution = request.solution ?? {};
      const wrongCells = generated.cells
        .filter((cell) => !cell.given)
        .filter((cell) => solution[cell.id] !== cell.value)
        .map((cell) => cell.id);

      if (wrongCells.length > 0) {
        return {
          solved: false,
          wrongCells,
          elapsedSeconds: null,
          newBest: null,
          progress: null,
          message: 'Hay respuestas incorrectas. Corrige las casillas marcadas.',
        };
      }

      return recordCompletion(user.id, level, request.elapsedSeconds ?? 1);
    },
  },
};

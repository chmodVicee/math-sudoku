import { beforeAll, describe, expect, it, vi } from 'vitest';
import { generateLevel } from '../../game/levelGenerator';

function createLocalStorage() {
  const store = new Map();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    key: (index) => [...store.keys()][index] ?? null,
    removeItem: (key) => store.delete(key),
    setItem: (key, value) => store.set(key, String(value)),
  };
}

let localData;

beforeAll(async () => {
  vi.stubGlobal('localStorage', createLocalStorage());
  ({ localData } = await import('./localData'));
});

function solve(level) {
  return Object.fromEntries(
    generateLevel(level.level, level.seed)
      .cells
      .filter((cell) => !cell.given)
      .map((cell) => [cell.id, cell.value]),
  );
}

describe('modo local offline-first', () => {
  const credentials = { username: `jugador_${Date.now()}`, password: 'secreto123' };

  it('registra, inicia y cierra sesión con hash local', async () => {
    const user = await localData.auth.register(credentials);
    expect(user.username).toBe(credentials.username);
    expect(await localData.auth.me()).toEqual(user);

    await localData.auth.logout();
    expect(await localData.auth.me()).toBeNull();

    await expect(
      localData.auth.login({ ...credentials, password: 'incorrecta' }),
    ).rejects.toThrow('Usuario o contraseña incorrectos');

    const logged = await localData.auth.login(credentials);
    expect(logged).toEqual(user);
  });

  it('genera el nivel sin revelar las respuestas y guarda el progreso al completar', async () => {
    const progressBefore = await localData.progress.get();
    expect(progressBefore.currentLevel).toBe(1);

    const level = await localData.game.getLevel(1);
    expect(level.cells.filter((cell) => !cell.given).every((cell) => cell.value === null)).toBe(true);

    const solution = solve(level);
    const result = await localData.game.completeLevel(1, {
      seed: level.seed,
      elapsedSeconds: 42,
      solution,
    });

    expect(result.solved).toBe(true);
    expect(result.progress.currentLevel).toBe(2);
    expect(result.progress.totalLevelsCompleted).toBe(1);
    expect(result.progress.bestTimes[0]).toMatchObject({ level: 1, bestSeconds: 42 });
  });

  it('marca las casillas incorrectas sin guardar progreso', async () => {
    const level = await localData.game.getLevel(2);
    const solution = solve(level);
    const [firstId] = Object.keys(solution);
    solution[firstId] += 1;

    const result = await localData.game.completeLevel(2, {
      seed: level.seed,
      elapsedSeconds: 10,
      solution,
    });

    expect(result.solved).toBe(false);
    expect(result.wrongCells).toContain(firstId);
    expect(result.progress).toBeNull();
  });

  it('no permite saltar a un nivel bloqueado', async () => {
    await expect(localData.game.getLevel(99)).rejects.toMatchObject({ status: 409 });
  });
});

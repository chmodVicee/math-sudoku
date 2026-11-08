/**
 * Almacenamiento SQLite para Android. El esquema replica el del backend
 * (users, progress, level_results) y añade columnas de sincronización para
 * poder subir los datos a la versión online en el futuro.
 */
const DATABASE = 'mathsudoku';
const DATABASE_VERSION = 1;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  created_at    TEXT NOT NULL,
  remote_id     INTEGER,
  sync_status   TEXT NOT NULL DEFAULT 'pending'
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_users_username_lower ON users (lower(username));

CREATE TABLE IF NOT EXISTS progress (
  user_id                INTEGER PRIMARY KEY,
  current_level          INTEGER NOT NULL DEFAULT 1,
  highest_level          INTEGER NOT NULL DEFAULT 1,
  total_levels_completed INTEGER NOT NULL DEFAULT 0,
  total_time_seconds     INTEGER NOT NULL DEFAULT 0,
  updated_at             TEXT NOT NULL,
  sync_status            TEXT NOT NULL DEFAULT 'pending',
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS level_results (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        INTEGER NOT NULL,
  level_number   INTEGER NOT NULL,
  best_seconds   INTEGER NOT NULL,
  attempts       INTEGER NOT NULL DEFAULT 1,
  last_played_at TEXT NOT NULL,
  sync_status    TEXT NOT NULL DEFAULT 'pending',
  CONSTRAINT ux_level_results_user_level UNIQUE (user_id, level_number),
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_level_results_user ON level_results (user_id);
`;

let connectionPromise = null;

async function getDb() {
  if (!connectionPromise) {
    connectionPromise = openDatabase();
  }
  return connectionPromise;
}

async function openDatabase() {
  const { CapacitorSQLite, SQLiteConnection } = await import('@capacitor-community/sqlite');
  const sqlite = new SQLiteConnection(CapacitorSQLite);
  const existing = await sqlite.isConnection(DATABASE, false);

  const db = existing.result
    ? await sqlite.retrieveConnection(DATABASE, false)
    : await sqlite.createConnection(DATABASE, false, 'no-encryption', DATABASE_VERSION, false);

  const openState = await db.isDBOpen();
  if (!openState.result) {
    await db.open();
  }
  await db.execute(SCHEMA);
  return db;
}

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
    passwordSalt: row.password_salt,
    createdAt: row.created_at,
    remoteId: row.remote_id ?? null,
    syncStatus: row.sync_status,
  };
}

function mapProgress(row) {
  if (!row) return null;
  return {
    userId: row.user_id,
    currentLevel: row.current_level,
    highestLevel: row.highest_level,
    totalLevelsCompleted: row.total_levels_completed,
    totalTimeSeconds: row.total_time_seconds,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status,
  };
}

function mapLevelResult(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    level: row.level_number,
    bestSeconds: row.best_seconds,
    attempts: row.attempts,
    lastPlayedAt: row.last_played_at,
    syncStatus: row.sync_status,
  };
}

export const sqliteStorage = {
  async init() {
    await getDb();
  },

  async getUserByUsername(username) {
    const db = await getDb();
    const result = await db.query(
      'SELECT * FROM users WHERE lower(username) = lower(?) LIMIT 1',
      [username.trim()],
    );
    return mapUser(result.values?.[0]);
  },

  async getUserById(id) {
    const db = await getDb();
    const result = await db.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
    return mapUser(result.values?.[0]);
  },

  async insertUser(user) {
    const db = await getDb();
    const result = await db.run(
      `INSERT INTO users (username, password_hash, password_salt, created_at, remote_id, sync_status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        user.username,
        user.passwordHash,
        user.passwordSalt,
        user.createdAt,
        user.remoteId ?? null,
        user.syncStatus ?? 'pending',
      ],
    );
    return { ...user, id: result.changes?.lastId };
  },

  async updateUser(user) {
    const db = await getDb();
    await db.run(
      `UPDATE users
       SET username = ?, password_hash = ?, password_salt = ?, remote_id = ?, sync_status = ?
       WHERE id = ?`,
      [
        user.username,
        user.passwordHash,
        user.passwordSalt,
        user.remoteId ?? null,
        user.syncStatus ?? 'pending',
        user.id,
      ],
    );
    return user;
  },

  async getProgress(userId) {
    const db = await getDb();
    const result = await db.query('SELECT * FROM progress WHERE user_id = ? LIMIT 1', [userId]);
    return mapProgress(result.values?.[0]);
  },

  async insertProgress(progress) {
    const db = await getDb();
    await db.run(
      `INSERT OR REPLACE INTO progress
       (user_id, current_level, highest_level, total_levels_completed, total_time_seconds, updated_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        progress.userId,
        progress.currentLevel,
        progress.highestLevel,
        progress.totalLevelsCompleted,
        progress.totalTimeSeconds,
        progress.updatedAt,
        progress.syncStatus ?? 'pending',
      ],
    );
    return progress;
  },

  async updateProgress(progress) {
    return this.insertProgress(progress);
  },

  async getLevelResults(userId) {
    const db = await getDb();
    const result = await db.query(
      'SELECT * FROM level_results WHERE user_id = ? ORDER BY level_number ASC',
      [userId],
    );
    return (result.values ?? []).map(mapLevelResult);
  },

  async getLevelResult(userId, level) {
    const db = await getDb();
    const result = await db.query(
      'SELECT * FROM level_results WHERE user_id = ? AND level_number = ? LIMIT 1',
      [userId, level],
    );
    return mapLevelResult(result.values?.[0]);
  },

  async insertLevelResult(levelResult) {
    const db = await getDb();
    const result = await db.run(
      `INSERT INTO level_results
       (user_id, level_number, best_seconds, attempts, last_played_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        levelResult.userId,
        levelResult.level,
        levelResult.bestSeconds,
        levelResult.attempts,
        levelResult.lastPlayedAt,
        levelResult.syncStatus ?? 'pending',
      ],
    );
    return { ...levelResult, id: result.changes?.lastId };
  },

  async updateLevelResult(levelResult) {
    const db = await getDb();
    await db.run(
      `UPDATE level_results
       SET best_seconds = ?, attempts = ?, last_played_at = ?, sync_status = ?
       WHERE id = ?`,
      [
        levelResult.bestSeconds,
        levelResult.attempts,
        levelResult.lastPlayedAt,
        levelResult.syncStatus ?? 'pending',
        levelResult.id,
      ],
    );
    return levelResult;
  },
};

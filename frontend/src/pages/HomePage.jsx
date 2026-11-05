import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import BrandMark from '../components/BrandMark';
import { ClockIcon, LogoutIcon, PlayIcon, RefreshIcon, TrophyIcon } from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import { formatDuration, formatTime } from '../utils/time';

function StatCard({ icon, label, value, hint, tone }) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <span className="stat-icon">{icon}</span>
      <div>
        <span className="stat-label">{label}</span>
        <strong className="stat-value">{value}</strong>
        <span className="stat-hint">{hint}</span>
      </div>
    </article>
  );
}

export default function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProgress = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setProgress(await api('/progress'));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const bestTimes = progress?.bestTimes ?? [];
  const overallBest = bestTimes.length
    ? Math.min(...bestTimes.map((result) => result.bestSeconds))
    : null;

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="dashboard">
      <div className="dashboard-glow" aria-hidden="true" />

      <header className="dashboard-header">
        <BrandMark />
        <div className="header-actions">
          <div className="user-chip">
            <span className="user-avatar">{user.username.charAt(0).toUpperCase()}</span>
            <span>{user.username}</span>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={handleLogout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <LogoutIcon />
          </button>
        </div>
      </header>

      {loading && (
        <div className="dashboard-loading">
          <span className="spinner" />
          <p>Cargando tu progreso…</p>
        </div>
      )}

      {!loading && error && (
        <div className="empty-state">
          <h2>No pudimos cargar tu progreso</h2>
          <p>{error}</p>
          <button type="button" className="btn btn-primary" onClick={loadProgress}>
            <RefreshIcon className="btn-icon" /> Reintentar
          </button>
        </div>
      )}

      {!loading && progress && (
        <main className="dashboard-main">
          <section className="hero-card">
            <div className="hero-copy">
              <span className="eyebrow">Hola, {user.username}</span>
              <h1>
                Tu próximo reto es el <span>nivel {progress.currentLevel}</span>
              </h1>
              <p>
                Cada nivel se genera al azar con operaciones nuevas. Arrastra los resultados,
                completa el tablero y supera tu propio tiempo.
              </p>
              <div className="hero-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={() => navigate('/jugar')}
                >
                  <PlayIcon className="btn-icon" />
                  Jugar nivel {progress.currentLevel}
                </button>
                {progress.totalLevelsCompleted > 0 && (
                  <span className="hero-note">
                    {progress.totalLevelsCompleted}{' '}
                    {progress.totalLevelsCompleted === 1 ? 'nivel superado' : 'niveles superados'}
                  </span>
                )}
              </div>
            </div>

            <div className="hero-visual" aria-hidden="true">
              <div className="hero-equation hero-equation--main">
                <span>12 ÷ 3</span>
                <strong>4</strong>
              </div>
              <div className="hero-equation hero-equation--float">
                <span>7 + 8</span>
                <strong>15</strong>
              </div>
              <div className="hero-equation hero-equation--small">
                <span>9 − 5</span>
                <strong>4</strong>
              </div>
            </div>
          </section>

          <section className="stats-grid">
            <StatCard
              tone="indigo"
              icon={<PlayIcon />}
              label="Nivel actual"
              value={progress.currentLevel}
              hint="Siguiente por jugar"
            />
            <StatCard
              tone="teal"
              icon={<TrophyIcon />}
              label="Niveles superados"
              value={progress.totalLevelsCompleted}
              hint="Sin límite de meta"
            />
            <StatCard
              tone="violet"
              icon={<ClockIcon />}
              label="Tiempo jugado"
              value={formatDuration(progress.totalTimeSeconds)}
              hint="En todos los niveles"
            />
            <StatCard
              tone="amber"
              icon={<ClockIcon />}
              label="Mejor tiempo"
              value={overallBest === null ? '—' : formatTime(overallBest)}
              hint="Tu mejor nivel"
            />
          </section>

          <div className="dashboard-columns">
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <span className="panel-kicker">Récords</span>
                  <h2>Mejores tiempos</h2>
                </div>
                <TrophyIcon className="panel-icon" />
              </div>

              {bestTimes.length === 0 ? (
                <p className="panel-empty">
                  Todavía no has completado un nivel. ¡El primero es el más fácil!
                </p>
              ) : (
                <div className="records-table-wrap">
                  <table className="records-table">
                    <thead>
                      <tr>
                        <th>Nivel</th>
                        <th>Mejor tiempo</th>
                        <th>Intentos</th>
                        <th aria-label="Acciones" />
                      </tr>
                    </thead>
                    <tbody>
                      {bestTimes.map((result) => (
                        <tr key={result.level}>
                          <td>
                            <span className="level-badge">{result.level}</span>
                          </td>
                          <td className="mono">{formatTime(result.bestSeconds)}</td>
                          <td>{result.attempts}</td>
                          <td className="cell-action">
                            <button
                              type="button"
                              className="link-btn"
                              onClick={() => navigate(`/jugar?level=${result.level}`)}
                            >
                              Rejugar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="panel rules-panel">
              <div className="panel-heading">
                <div>
                  <span className="panel-kicker">Reglas</span>
                  <h2>Cómo jugar</h2>
                </div>
              </div>
              <ol className="rules-list">
                <li>Mira la operación de cada casilla vacía.</li>
                <li>
                  Arrastra el número que resuelve la operación. También puedes tocar el número y
                  luego la casilla.
                </li>
                <li>Completa el tablero; el reloj corre desde el primer segundo.</li>
                <li>Al terminar, decide si continúas al siguiente nivel o sales.</li>
              </ol>
              <p className="rules-note">
                Cada fila y columna tiene resultados distintos, como en un sudoku. Los niveles no
                tienen final: cada vez son más desafiantes.
              </p>
            </section>
          </div>
        </main>
      )}
    </div>
  );
}

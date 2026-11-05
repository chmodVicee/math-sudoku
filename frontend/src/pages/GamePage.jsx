import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import Board from '../components/Board';
import BrandMark from '../components/BrandMark';
import { ArrowLeftIcon, ClockIcon, RefreshIcon } from '../components/Icons';
import LevelCompleteModal from '../components/LevelCompleteModal';
import OptionsTray from '../components/OptionsTray';
import { formatTime } from '../utils/time';

export default function GamePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedLevelRef = useRef(Number(searchParams.get('level')));

  const [game, setGame] = useState(null);
  const [progress, setProgress] = useState(null);
  const [placement, setPlacement] = useState({});
  const [trayItems, setTrayItems] = useState([]);
  const [selectedValue, setSelectedValue] = useState(null);
  const [wrongCells, setWrongCells] = useState([]);
  const [sortActive, setSortActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [solved, setSolved] = useState(false);
  const [checking, setChecking] = useState(false);
  const [modal, setModal] = useState(null);
  const [continuing, setContinuing] = useState(false);
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const startRef = useRef(Date.now());
  const checkingRef = useRef(false);
  const attemptedSignatureRef = useRef(null);
  const initializedRef = useRef(false);

  const startLevel = useCallback((levelData) => {
    setGame(levelData);
    setTrayItems(levelData.options);
    setPlacement({});
    setSelectedValue(null);
    setWrongCells([]);
    setSortActive(false);
    setElapsed(0);
    setSolved(false);
    setChecking(false);
    setModal(null);
    setNotice(null);
    attemptedSignatureRef.current = null;
    startRef.current = Date.now();
    setRunning(true);
  }, []);

  const loadGame = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const currentProgress = await api('/progress');
      setProgress(currentProgress);

      const requested = requestedLevelRef.current;
      const level =
        Number.isInteger(requested) && requested >= 1 && requested <= currentProgress.currentLevel
          ? requested
          : currentProgress.currentLevel;

      const levelData = await api(`/game/levels/${level}`);
      startLevel(levelData);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [startLevel]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    loadGame();
  }, [loadGame]);

  useEffect(() => {
    if (!running) return undefined;
    const interval = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 250);
    return () => window.clearInterval(interval);
  }, [running]);

  const filledCount = Object.keys(placement).length;

  const placementSignature = useMemo(() => {
    if (!game) return '';
    return game.cells
      .filter((cell) => !cell.given)
      .map((cell) => `${cell.id}:${placement[cell.id] ?? ''}`)
      .join('|');
  }, [game, placement]);

  const submitSolution = useCallback(async () => {
    if (!game || solved || checkingRef.current) return;

    checkingRef.current = true;
    setChecking(true);
    setNotice(null);

    const seconds = Math.max(1, Math.floor((Date.now() - startRef.current) / 1000));

    try {
      const response = await api(`/game/levels/${game.level}/complete`, {
        method: 'POST',
        body: {
          seed: game.seed,
          elapsedSeconds: seconds,
          solution: placement,
        },
      });

      if (response.solved) {
        const finalSeconds = response.elapsedSeconds ?? seconds;
        setRunning(false);
        setElapsed(finalSeconds);
        setSolved(true);
        setWrongCells([]);
        setProgress(response.progress);
        setModal({
          level: game.level,
          elapsed: finalSeconds,
          newBest: Boolean(response.newBest),
        });
      } else {
        setWrongCells(response.wrongCells ?? []);
        setNotice({
          type: 'error',
          text: response.message || 'Hay respuestas incorrectas. Corrige las casillas marcadas.',
        });
        attemptedSignatureRef.current = placementSignature;
      }
    } catch (requestError) {
      setNotice({
        type: 'error',
        text: requestError.message,
        retryable: true,
      });
    } finally {
      checkingRef.current = false;
      setChecking(false);
    }
  }, [game, placement, placementSignature, solved]);

  useEffect(() => {
    if (!game || solved || loading) return;
    if (game.emptyCount === 0) return;
    if (filledCount !== game.emptyCount) return;
    if (attemptedSignatureRef.current === placementSignature) return;

    attemptedSignatureRef.current = placementSignature;
    submitSolution();
  }, [filledCount, game, loading, placementSignature, solved, submitSolution]);

  function handlePlaceValue(cellId, value) {
    if (solved) return;
    setPlacement((previous) => ({ ...previous, [cellId]: value }));
    setSelectedValue(null);
    setWrongCells((previous) => previous.filter((id) => id !== cellId));
    setNotice(null);
  }

  function handleClearCell(cellId) {
    if (solved) return;
    setPlacement((previous) => {
      const next = { ...previous };
      delete next[cellId];
      return next;
    });
    setWrongCells((previous) => previous.filter((id) => id !== cellId));
    setNotice(null);
  }

  function handleCellClick(cell) {
    if (!game || solved || cell.given) return;
    if (placement[cell.id] !== undefined) {
      handleClearCell(cell.id);
      return;
    }
    if (selectedValue !== null) {
      handlePlaceValue(cell.id, selectedValue);
    }
  }

  function handleSelectOption(value) {
    setSelectedValue((previous) => (previous === value ? null : value));
  }

  function handleSort() {
    setTrayItems((items) => [...items].sort((a, b) => a.value - b.value));
    setSortActive(true);
  }

  function handleShuffle() {
    setTrayItems((items) => {
      const shuffled = [...items];
      for (let i = shuffled.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    });
    setSortActive(false);
  }

  async function handleContinue() {
    if (continuing) return;
    setContinuing(true);
    try {
      let current = progress;
      if (!current) {
        current = await api('/progress');
        setProgress(current);
      }
      const nextLevel = await api(`/game/levels/${current.currentLevel}`);
      startLevel(nextLevel);
    } catch (requestError) {
      setNotice({ type: 'error', text: requestError.message, retryable: true });
    } finally {
      setContinuing(false);
    }
  }

  function handleExit() {
    navigate('/');
  }

  if (loading) {
    return (
      <div className="game-page game-page--centered">
        <div className="dashboard-loading">
          <span className="spinner" />
          <p>Generando tu nivel…</p>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="game-page game-page--centered">
        <div className="empty-state">
          <h2>No pudimos cargar el nivel</h2>
          <p>{error || 'Ocurrió un error inesperado.'}</p>
          <div className="empty-actions">
            <button type="button" className="btn btn-primary" onClick={loadGame}>
              <RefreshIcon className="btn-icon" /> Reintentar
            </button>
            <button type="button" className="btn btn-ghost" onClick={handleExit}>
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progressPercent = game.emptyCount === 0
    ? 0
    : Math.round((filledCount / game.emptyCount) * 100);

  return (
    <div className="game-page">
      <header className="game-header">
        <button type="button" className="back-btn" onClick={handleExit}>
          <ArrowLeftIcon className="btn-icon" />
          Inicio
        </button>

        <div className="game-brand">
          <BrandMark />
        </div>

        <div className="game-hud">
          <span className="hud-pill hud-pill--level">Nivel {game.level}</span>
          <span className="hud-pill hud-pill--time">
            <ClockIcon className="hud-icon" />
            {formatTime(elapsed)}
          </span>
        </div>
      </header>

      <main className="game-main">
        <section className="board-panel">
          <div className="board-heading">
            <div>
              <span className="panel-kicker">
                Tablero {game.size} × {game.size}
              </span>
              <h1>Completa los resultados</h1>
              <p>
                Arrastra un número a cada casilla. También puedes tocar el número y luego la casilla.
              </p>
            </div>

            <div className="level-progress">
              <span>
                {filledCount} / {game.emptyCount} casillas
              </span>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </div>

          <Board
            game={game}
            placement={placement}
            selectedValue={selectedValue}
            wrongCells={wrongCells}
            solved={solved}
            onCellClick={handleCellClick}
            onPlaceValue={handlePlaceValue}
          />

          <div className="board-footer">
            <span className="legend">
              <i className="dot dot--given" /> Pista
            </span>
            <span className="legend">
              <i className="dot dot--filled" /> Tu respuesta
            </span>
            <span className="legend">
              <i className="dot dot--wrong" /> Incorrecta
            </span>
            {checking && (
              <span className="checking">
                <span className="spinner spinner--tiny" /> Comprobando…
              </span>
            )}
          </div>
        </section>

        <OptionsTray
          items={trayItems}
          selectedValue={selectedValue}
          disabled={solved}
          sortActive={sortActive}
          onSelect={handleSelectOption}
          onSort={handleSort}
          onShuffle={handleShuffle}
        />
      </main>

      {notice && (
        <div className={`toast toast--${notice.type}`} role="status">
          <span>{notice.text}</span>
          {notice.retryable && (
            <button type="button" className="toast-action" onClick={submitSolution}>
              Reintentar
            </button>
          )}
        </div>
      )}

      {modal && (
        <LevelCompleteModal
          data={modal}
          continuing={continuing}
          onContinue={handleContinue}
          onExit={handleExit}
        />
      )}
    </div>
  );
}

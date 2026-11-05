import { formatTime } from '../utils/time';

export default function LevelCompleteModal({ data, continuing, onContinue, onExit }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="level-complete-title">
        <div className="modal-burst" aria-hidden="true">
          <span>+</span>
          <span>×</span>
          <span>÷</span>
          <span>−</span>
        </div>

        <div className="modal-icon" aria-hidden="true">
          🎉
        </div>
        <h2 id="level-complete-title">Felicitaciones, has finalizado el nivel</h2>
        <p className="modal-question">Deseas continuar? o Salir</p>

        <div className="modal-stats">
          <div>
            <span>Nivel</span>
            <strong>{data.level}</strong>
          </div>
          <div>
            <span>Tu tiempo</span>
            <strong>{formatTime(data.elapsed)}</strong>
          </div>
        </div>

        {data.newBest && <span className="record-badge">¡Nuevo récord personal!</span>}

        <div className="modal-actions">
          <button type="button" className="btn btn-primary" onClick={onContinue} disabled={continuing}>
            {continuing ? 'Cargando…' : 'Continuar'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onExit} disabled={continuing}>
            Salir
          </button>
        </div>
      </div>
    </div>
  );
}

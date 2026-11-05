import { ShuffleIcon, SortIcon } from './Icons';

export default function OptionsTray({
  items,
  selectedValue,
  disabled,
  sortActive,
  onSelect,
  onSort,
  onShuffle,
}) {
  return (
    <aside className="options-panel">
      <div className="options-heading">
        <div>
          <span className="panel-kicker">Números disponibles</span>
          <h2>Opciones</h2>
        </div>
        <span className="options-count">{items.length}</span>
      </div>

      <div className="tray-actions">
        <button
          type="button"
          className={`btn btn-soft ${sortActive ? 'is-active' : ''}`}
          onClick={onSort}
          disabled={disabled}
        >
          <SortIcon className="btn-icon" />
          Ordenar de menor a mayor
        </button>
        <button type="button" className="btn btn-soft" onClick={onShuffle} disabled={disabled}>
          <ShuffleIcon className="btn-icon" />
          Mezclar
        </button>
      </div>

      <div className="options-tray" role="group" aria-label="Números para arrastrar">
        {items.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`option-chip ${selectedValue === option.value ? 'is-selected' : ''}`}
            draggable={!disabled}
            onDragStart={(event) => {
              event.dataTransfer.setData('text/plain', String(option.value));
              event.dataTransfer.effectAllowed = 'copy';
            }}
            onClick={() => onSelect(option.value)}
            disabled={disabled}
            aria-pressed={selectedValue === option.value}
          >
            {option.value}
          </button>
        ))}
      </div>

      <p className="tray-help">
        {selectedValue === null
          ? 'Arrastra un número a una casilla o tócalo para seleccionarlo.'
          : `Elegiste el ${selectedValue}. Ahora toca la casilla donde va.`}
      </p>

      <div className="sudoku-note">
        <strong>Pista de sudoku</strong>
        <p>Cada fila y cada columna tienen resultados distintos. Úsalo cuando dudes.</p>
      </div>
    </aside>
  );
}

export default function Board({
  game,
  placement,
  selectedValue,
  wrongCells,
  solved,
  onCellClick,
  onPlaceValue,
}) {
  return (
    <div className="board" style={{ '--board-size': game.size }}>
      {game.cells.map((cell) => {
        const placed = placement[cell.id];
        const filled = cell.given || placed !== undefined;
        const value = cell.given ? cell.value : placed;
        const isWrong = wrongCells.includes(cell.id);
        const classes = [
          'board-cell',
          cell.given ? 'is-given' : '',
          !cell.given && filled ? 'is-filled' : '',
          !cell.given && !filled && selectedValue !== null ? 'is-target' : '',
          isWrong ? 'is-wrong' : '',
          solved ? 'is-locked' : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <button
            key={cell.id}
            type="button"
            className={classes}
            onClick={() => onCellClick(cell)}
            onDragOver={(event) => {
              if (!cell.given && !solved) {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'copy';
              }
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (cell.given || solved) return;
              const dropped = Number(event.dataTransfer.getData('text/plain'));
              if (Number.isInteger(dropped)) {
                onPlaceValue(cell.id, dropped);
              }
            }}
            disabled={cell.given || solved}
            aria-label={
              cell.given
                ? `${cell.expression}, pista con resultado ${cell.value}`
                : `${cell.expression}${filled ? `, respuesta ${value}` : ', casilla vacía'}`
            }
          >
            <span className="cell-expression">{cell.expression}</span>
            <span className={`cell-value ${filled ? '' : 'is-empty'}`}>
              {filled ? value : '?'}
            </span>
            {!cell.given && filled && !solved && (
              <span className="cell-clear" aria-hidden="true">
                ×
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

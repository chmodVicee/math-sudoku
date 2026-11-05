export default function BrandMark({ compact = false }) {
  return (
    <div className={`brand ${compact ? 'brand--compact' : ''}`}>
      <span className="brand-tile" aria-hidden="true">
        7
      </span>
      {!compact && (
        <span className="brand-text">
          Math<strong>Sudoku</strong>
        </span>
      )}
    </div>
  );
}

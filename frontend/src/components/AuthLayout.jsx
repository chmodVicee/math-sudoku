import BrandMark from './BrandMark';

const SAMPLE_TILES = [
  { expression: '7 + 5', value: 12, tone: 'indigo' },
  { expression: '9 − 4', value: 5, tone: 'teal' },
  { expression: '3 × 4', value: 12, tone: 'amber' },
  { expression: '18 ÷ 2', value: 9, tone: 'violet' },
  { expression: '6 + 7', value: 13, tone: 'teal' },
  { expression: '5 × 5', value: 25, tone: 'indigo' },
];

export default function AuthLayout({ children }) {
  return (
    <div className="auth-page">
      <aside className="auth-showcase">
        <BrandMark />

        <div className="showcase-content">
          <span className="eyebrow">Sudoku + matemática básica</span>
          <h1>
            Entrena tu mente,
            <br />
            <span>nivel por nivel.</span>
          </h1>
          <p className="showcase-lead">
            Completa el tablero arrastrando el resultado correcto de cada operación. Sin escribir
            números, sin límite de niveles.
          </p>

          <div className="showcase-board" aria-hidden="true">
            {SAMPLE_TILES.map((tile) => (
              <div key={tile.expression} className={`showcase-tile showcase-tile--${tile.tone}`}>
                <span>{tile.expression}</span>
                <strong>{tile.value}</strong>
              </div>
            ))}
          </div>

          <ul className="showcase-features">
            <li>Sumas, restas, multiplicaciones y divisiones</li>
            <li>Temporizador y récords por nivel</li>
            <li>Tu progreso se guarda automáticamente</li>
          </ul>
        </div>

        <p className="showcase-footer">Math Sudoku · Un reto nuevo cada vez que juegas.</p>
      </aside>

      <main className="auth-panel">{children}</main>
    </div>
  );
}

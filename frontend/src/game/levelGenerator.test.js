import { describe, expect, it } from 'vitest';
import fixtures from './fixtures/java-levels.json';
import { generateLevel } from './levelGenerator';
import { evaluate } from './expressionEvaluator';

function toComparable(level) {
  return {
    level: level.level,
    size: level.size,
    seed: level.seed,
    givenCount: level.givenCount,
    cells: level.cells.map((cell) => ({
      id: cell.id,
      row: cell.row,
      col: cell.col,
      expression: cell.expression,
      value: cell.value,
      given: cell.given,
    })),
    options: level.options.map((option) => ({ id: option.id, value: option.value })),
  };
}

describe('levelGenerator (paridad con Java)', () => {
  it('genera exactamente los mismos niveles que el backend para cada semilla', () => {
    for (const fixture of fixtures) {
      const generated = generateLevel(fixture.level, fixture.seed);
      expect(toComparable(generated)).toEqual(toComparable(fixture));
    }
  });

  it('es determinista', () => {
    const first = generateLevel(12, 987654321);
    const second = generateLevel(12, 987654321);
    expect(first).toEqual(second);
  });

  it('rechaza niveles fuera de rango', () => {
    expect(() => generateLevel(0, 1)).toThrow('Número de nivel inválido');
    expect(() => generateLevel(100001, 1)).toThrow('Número de nivel inválido');
  });
});

describe('reglas del nivel', () => {
  const level = generateLevel(9, 2024);

  it('usa un cuadrado latino: cada fila y columna tiene valores distintos', () => {
    const rows = new Map();
    const cols = new Map();

    for (const cell of level.cells) {
      if (!rows.has(cell.row)) rows.set(cell.row, new Set());
      if (!cols.has(cell.col)) cols.set(cell.col, new Set());
      rows.get(cell.row).add(cell.value);
      cols.get(cell.col).add(cell.value);
    }

    for (const values of rows.values()) expect(values.size).toBe(level.size);
    for (const values of cols.values()) expect(values.size).toBe(level.size);
  });

  it('incluye todas las respuestas correctas entre las opciones', () => {
    const optionValues = new Set(level.options.map((option) => option.value));
    for (const cell of level.cells) {
      expect(optionValues.has(cell.value)).toBe(true);
    }
  });

  it('no repite problemas ni sus variantes conmutativas', () => {
    const keys = level.cells.map((cell) => {
      const tokens = cell.expression.split(' ');
      if (tokens.length === 3 && (tokens[1] === '+' || tokens[1] === '×')) {
        const left = Number(tokens[0]);
        const right = Number(tokens[2]);
        return `${Math.min(left, right)} ${tokens[1]} ${Math.max(left, right)}`;
      }
      return cell.expression;
    });

    expect(new Set(keys).size).toBe(keys.length);
  });

  it('cada expresión evalúa al valor de la casilla', () => {
    for (const cell of level.cells) {
      expect(evaluate(cell.expression)).toBe(cell.value);
    }
  });

  it('entrega tantas opciones como valores correctos más distractores', () => {
    const correct = new Set(level.cells.map((cell) => cell.value)).size;
    const expected = correct + Math.min(6, 2 + Math.floor(level.level / 4));
    expect(level.options.length).toBe(expected);
  });
});

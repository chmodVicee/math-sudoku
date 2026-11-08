import { JavaRandom, shuffle } from './javaRandom';
import { evaluate } from './expressionEvaluator';

export const MAX_LEVEL = 100_000;

/**
 * Port directo de LevelGenerator.java. Mantiene el mismo orden de consumo de
 * números aleatorios para que una semilla genere el mismo nivel en ambos lados.
 */
export function generateLevel(level, seed) {
  if (!Number.isInteger(level) || level < 1 || level > MAX_LEVEL) {
    throw new Error('Número de nivel inválido');
  }

  const random = new JavaRandom(seed);
  const size = level <= 2 ? 3 : 4;
  const values = pickValues(size, level, random);

  const symbolGrid = latinSquare(size, random);
  const givenCount = givensFor(level, size);
  const givenPositions = pickGivenPositions(size, givenCount, random);

  const cells = [];
  const usedExpressions = new Set();

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const value = values[symbolGrid[row][col]];
      const expression = buildExpression(value, level, random, usedExpressions);
      const given = givenPositions.has(row * size + col);
      cells.push({
        id: cellId(row, col),
        row,
        col,
        expression,
        value,
        given,
      });
    }
  }

  return {
    level,
    size,
    seed,
    givenCount,
    cells,
    options: buildOptions(values, level, random),
  };
}

function pickValues(size, level, random) {
  let min;
  let max;

  if (size === 3) {
    min = 2;
    max = 9;
  } else if (level <= 5) {
    min = 3;
    max = 12;
  } else if (level <= 10) {
    min = 5;
    max = 20;
  } else if (level <= 20) {
    min = 8;
    max = 40;
  } else {
    min = 10;
    max = 60;
  }

  const chosen = new Set();
  let attempts = 0;
  while (chosen.size < size && attempts < 500) {
    attempts += 1;
    chosen.add(min + random.nextInt(max - min + 1));
  }

  // Respaldo determinista por si el rango fuera demasiado pequeño.
  let candidate = min;
  while (chosen.size < size) {
    chosen.add(candidate);
    candidate += 1;
  }

  return [...chosen];
}

/**
 * Cuadrado latino: cada fila y cada columna contiene exactamente los mismos
 * símbolos, por lo que los resultados de cada fila/columna son distintos.
 */
function latinSquare(size, random) {
  const rowOrder = shuffledRange(size, random);
  const colOrder = shuffledRange(size, random);
  const grid = Array.from({ length: size }, () => new Array(size).fill(0));

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const sum = rowOrder[row] + colOrder[col];
      grid[row][col] = ((sum % size) + size) % size;
    }
  }
  return grid;
}

function shuffledRange(size, random) {
  const range = Array.from({ length: size }, (_, index) => index);
  return shuffle(range, random);
}

function givensFor(level, size) {
  if (size === 3) {
    return level === 1 ? 3 : 2;
  }
  return Math.max(2, 5 - Math.floor((level - 3) / 4));
}

function pickGivenPositions(size, givenCount, random) {
  const positions = Array.from({ length: size * size }, (_, index) => index);
  shuffle(positions, random);
  return new Set(positions.slice(0, Math.min(givenCount, positions.length)));
}

function buildExpression(value, level, random, usedExpressions) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const expression = randomExpression(value, level, random);
    if (!usedExpressions.has(expressionKey(expression))) {
      usedExpressions.add(expressionKey(expression));
      return expression;
    }
  }

  // Respaldo determinista: restas con operandos distintos para no repetir el problema.
  for (let offset = 1; ; offset += 1) {
    const expression = `${value + offset} - ${offset}`;
    if (!usedExpressions.has(expressionKey(expression))) {
      usedExpressions.add(expressionKey(expression));
      return expression;
    }
  }
}

function randomExpression(value, level, random) {
  const maxOperand = Math.min(99, 8 + level * 3);
  const candidates = [];

  if (value >= 2) {
    const a = 1 + random.nextInt(Math.min(value - 1, maxOperand));
    candidates.push(`${a} + ${value - a}`);
  }

  const subtract = 1 + random.nextInt(Math.max(1, Math.min(maxOperand, 40)));
  candidates.push(`${value + subtract} - ${subtract}`);

  if (level >= 3) {
    const factors = factorPair(value);
    if (factors !== null) {
      candidates.push(`${factors[0]} × ${factors[1]}`);
    }

    const divisor = 2 + random.nextInt(8);
    candidates.push(`${value * divisor} ÷ ${divisor}`);
  }

  if (level >= 7 && random.nextInt(100) < 40) {
    const threeTerm = threeTermExpression(value, maxOperand, random);
    if (threeTerm !== null) {
      candidates.push(threeTerm);
    }
  }

  const expression = candidates[random.nextInt(candidates.length)];
  if (evaluate(expression) !== value) {
    throw new Error(`Expresión inconsistente generada: ${expression} != ${value}`);
  }
  return expression;
}

/**
 * Clave que trata como iguales las variantes conmutativas de una misma operación,
 * por ejemplo "4 + 3" y "3 + 4", para no mostrarlas en casillas distintas.
 */
function expressionKey(expression) {
  const tokens = expression.split(' ');
  if (tokens.length === 3) {
    const left = Number.parseInt(tokens[0], 10);
    const right = Number.parseInt(tokens[2], 10);
    if (tokens[1] === '+' || tokens[1] === '×') {
      return `${Math.min(left, right)} ${tokens[1]} ${Math.max(left, right)}`;
    }
  }
  return expression;
}

function factorPair(value) {
  if (value < 4) {
    return null;
  }
  for (let a = 2; a * a <= value; a += 1) {
    if (value % a === 0) {
      return [a, value / a];
    }
  }
  return null;
}

function threeTermExpression(value, maxOperand, random) {
  const a = 2 + random.nextInt(8);
  const b = 2 + random.nextInt(8);
  const product = a * b;
  const difference = Math.abs(product - value);

  if (difference === 0) {
    return null;
  }
  if (difference <= maxOperand) {
    return product > value
      ? `${a} × ${b} - ${difference}`
      : `${a} × ${b} + ${difference}`;
  }

  const b2 = 2 + random.nextInt(8);
  const c2 = 2 + random.nextInt(8);
  const addend = value - b2 * c2;
  if (addend >= 1 && addend <= maxOperand) {
    return `${addend} + ${b2} × ${c2}`;
  }

  return null;
}

function buildOptions(values, level, random) {
  const correctValues = new Set(values);
  const optionValues = new Set(javaIntegerHashSetOrder(correctValues));

  const distractors = Math.min(6, 2 + Math.floor(level / 4));
  let attempts = 0;
  while (
    optionValues.size < correctValues.size + distractors
    && attempts < 300
  ) {
    attempts += 1;
    const anchor = values[random.nextInt(values.length)];
    const offset = 1 + random.nextInt(3);
    let candidate = random.nextBoolean() ? anchor + offset : anchor - offset;
    if (candidate < 1) {
      candidate = anchor + offset;
    }
    if (!correctValues.has(candidate)) {
      optionValues.add(candidate);
    }
  }

  const maxValue = values.length ? Math.max(...values) : 10;
  while (optionValues.size < correctValues.size + distractors) {
    const candidate = 1 + random.nextInt(maxValue + 20);
    if (!correctValues.has(candidate)) {
      optionValues.add(candidate);
    }
  }

  const shuffled = shuffle([...optionValues], random);
  return shuffled.map((value, index) => ({ id: `o${index + 1}`, value }));
}

/**
 * Reproduce el orden de iteración de un HashSet<Integer> de Java con capacidad
 * 16 (el que produce Collectors.toSet() para 3-4 elementos).
 */
function javaIntegerHashSetOrder(values) {
  const capacity = 16;
  const buckets = Array.from({ length: capacity }, () => []);
  for (const value of values) {
    const hash = (value ^ (value >>> 16)) & (capacity - 1);
    buckets[hash].push(value);
  }
  return buckets.flat();
}

function cellId(row, col) {
  return `r${row}c${col}`;
}

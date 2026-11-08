/**
 * Evaluador de las expresiones que genera el juego.
 * Respeta la precedencia de multiplicación y división sobre suma y resta.
 * Port directo de ExpressionEvaluator.java.
 */
export function evaluate(expression) {
  if (expression === null || expression === undefined || expression.trim() === '') {
    throw new Error('Expresión vacía');
  }

  const tokens = expression.trim().split(/\s+/);
  if (tokens.length < 3 || tokens.length % 2 === 0) {
    throw new Error(`Expresión inválida: ${expression}`);
  }

  const numbers = [];
  const operators = [];

  for (let i = 0; i < tokens.length; i += 1) {
    if (i % 2 === 0) {
      numbers.push(Number.parseInt(tokens[i], 10));
    } else {
      operators.push(tokens[i]);
    }
  }

  // Primera pasada: resolver × y ÷ de izquierda a derecha.
  const reducedNumbers = [numbers[0]];
  const reducedOperators = [];

  for (let i = 0; i < operators.length; i += 1) {
    const operator = operators[i];
    const next = numbers[i + 1];
    const previous = reducedNumbers[reducedNumbers.length - 1];

    if (operator === '×' || operator === '*') {
      reducedNumbers[reducedNumbers.length - 1] = previous * next;
    } else if (operator === '÷' || operator === '/') {
      if (next === 0 || previous % next !== 0) {
        throw new Error(`División no exacta: ${expression}`);
      }
      reducedNumbers[reducedNumbers.length - 1] = previous / next;
    } else {
      reducedOperators.push(operator);
      reducedNumbers.push(next);
    }
  }

  // Segunda pasada: suma y resta.
  let result = reducedNumbers[0];
  for (let i = 0; i < reducedOperators.length; i += 1) {
    const next = reducedNumbers[i + 1];
    if (reducedOperators[i] === '+') {
      result += next;
    } else if (reducedOperators[i] === '-') {
      result -= next;
    } else {
      throw new Error(`Operador inválido en: ${expression}`);
    }
  }

  return result;
}

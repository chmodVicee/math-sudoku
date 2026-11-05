package com.mathsudoku.game;

import java.util.ArrayList;
import java.util.List;

/**
 * Evaluador mínimo para las expresiones que genera el juego.
 * Respeta la precedencia de multiplicación y división sobre suma y resta.
 */
public final class ExpressionEvaluator {

    private ExpressionEvaluator() {
    }

    public static int evaluate(String expression) {
        if (expression == null || expression.isBlank()) {
            throw new IllegalArgumentException("Expresión vacía");
        }

        String[] tokens = expression.trim().split("\\s+");
        if (tokens.length < 3 || tokens.length % 2 == 0) {
            throw new IllegalArgumentException("Expresión inválida: " + expression);
        }

        List<Integer> numbers = new ArrayList<>();
        List<String> operators = new ArrayList<>();

        for (int i = 0; i < tokens.length; i++) {
            if (i % 2 == 0) {
                numbers.add(Integer.parseInt(tokens[i]));
            } else {
                operators.add(tokens[i]);
            }
        }

        // Primera pasada: resolver × y ÷ de izquierda a derecha.
        List<Integer> reducedNumbers = new ArrayList<>();
        List<String> reducedOperators = new ArrayList<>();
        reducedNumbers.add(numbers.getFirst());

        for (int i = 0; i < operators.size(); i++) {
            String operator = operators.get(i);
            int next = numbers.get(i + 1);
            int previous = reducedNumbers.getLast();

            switch (operator) {
                case "×", "*" -> reducedNumbers.set(reducedNumbers.size() - 1, Math.multiplyExact(previous, next));
                case "÷", "/" -> {
                    if (next == 0 || previous % next != 0) {
                        throw new IllegalArgumentException("División no exacta: " + expression);
                    }
                    reducedNumbers.set(reducedNumbers.size() - 1, previous / next);
                }
                default -> {
                    reducedOperators.add(operator);
                    reducedNumbers.add(next);
                }
            }
        }

        // Segunda pasada: suma y resta.
        int result = reducedNumbers.getFirst();
        for (int i = 0; i < reducedOperators.size(); i++) {
            int next = reducedNumbers.get(i + 1);
            result = switch (reducedOperators.get(i)) {
                case "+" -> Math.addExact(result, next);
                case "-" -> Math.subtractExact(result, next);
                default -> throw new IllegalArgumentException("Operador inválido en: " + expression);
            };
        }

        return result;
    }
}

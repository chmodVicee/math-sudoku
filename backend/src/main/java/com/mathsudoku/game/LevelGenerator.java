package com.mathsudoku.game;

import com.mathsudoku.common.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Random;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Component
public class LevelGenerator {

    private static final int MAX_LEVEL = 100_000;

    public GeneratedLevel generate(int level, long seed) {
        if (level < 1 || level > MAX_LEVEL) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Número de nivel inválido");
        }

        Random random = new Random(seed);
        int size = level <= 2 ? 3 : 4;
        int[] values = pickValues(size, level, random);

        int[][] symbolGrid = latinSquare(size, random);
        int givenCount = givensFor(level, size);
        Set<Integer> givenPositions = pickGivenPositions(size, givenCount, random);

        List<GeneratedCell> cells = new ArrayList<>(size * size);
        for (int row = 0; row < size; row++) {
            for (int col = 0; col < size; col++) {
                int value = values[symbolGrid[row][col]];
                String expression = buildExpression(value, level, random);
                boolean given = givenPositions.contains(row * size + col);
                cells.add(new GeneratedCell(
                        cellId(row, col),
                        row,
                        col,
                        expression,
                        value,
                        given));
            }
        }

        return new GeneratedLevel(level, size, seed, givenCount, cells, buildOptions(values, level, random));
    }

    private int[] pickValues(int size, int level, Random random) {
        int min;
        int max;

        if (size == 3) {
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

        Set<Integer> chosen = new LinkedHashSet<>();
        int attempts = 0;
        while (chosen.size() < size && attempts++ < 500) {
            chosen.add(min + random.nextInt(max - min + 1));
        }

        // Respaldo determinista por si el rango fuera demasiado pequeño.
        int candidate = min;
        while (chosen.size() < size) {
            chosen.add(candidate++);
        }

        return chosen.stream().mapToInt(Integer::intValue).toArray();
    }

    /**
     * Cuadrado latino: cada fila y cada columna contiene exactamente los mismos
     * símbolos, por lo que los resultados de cada fila/columna son distintos.
     */
    private int[][] latinSquare(int size, Random random) {
        List<Integer> rowOrder = shuffledRange(size, random);
        List<Integer> colOrder = shuffledRange(size, random);
        int[][] grid = new int[size][size];

        for (int row = 0; row < size; row++) {
            for (int col = 0; col < size; col++) {
                grid[row][col] = Math.floorMod(rowOrder.get(row) + colOrder.get(col), size);
            }
        }
        return grid;
    }

    private List<Integer> shuffledRange(int size, Random random) {
        List<Integer> range = IntStream.range(0, size).boxed().collect(Collectors.toList());
        Collections.shuffle(range, random);
        return range;
    }

    private int givensFor(int level, int size) {
        if (size == 3) {
            return level == 1 ? 3 : 2;
        }
        return Math.max(2, 5 - (level - 3) / 4);
    }

    private Set<Integer> pickGivenPositions(int size, int givenCount, Random random) {
        List<Integer> positions = IntStream.range(0, size * size)
                .boxed()
                .collect(Collectors.toList());
        Collections.shuffle(positions, random);
        return new LinkedHashSet<>(positions.subList(0, Math.min(givenCount, positions.size())));
    }

    private String buildExpression(int value, int level, Random random) {
        int maxOperand = Math.min(99, 8 + level * 3);
        List<String> candidates = new ArrayList<>();

        if (value >= 2) {
            int a = 1 + random.nextInt(Math.min(value - 1, maxOperand));
            candidates.add(a + " + " + (value - a));
        }

        int subtract = 1 + random.nextInt(Math.max(1, Math.min(maxOperand, 40)));
        candidates.add((value + subtract) + " - " + subtract);

        if (level >= 3) {
            int[] factors = factorPair(value);
            if (factors != null) {
                candidates.add(factors[0] + " × " + factors[1]);
            }

            int divisor = 2 + random.nextInt(8);
            candidates.add((value * divisor) + " ÷ " + divisor);
        }

        if (level >= 7 && random.nextInt(100) < 40) {
            String threeTerm = threeTermExpression(value, maxOperand, random);
            if (threeTerm != null) {
                candidates.add(threeTerm);
            }
        }

        String expression = candidates.get(random.nextInt(candidates.size()));
        if (ExpressionEvaluator.evaluate(expression) != value) {
            throw new IllegalStateException("Expresión inconsistente generada: " + expression + " != " + value);
        }
        return expression;
    }

    private int[] factorPair(int value) {
        if (value < 4) {
            return null;
        }
        for (int a = 2; a * a <= value; a++) {
            if (value % a == 0) {
                return new int[]{a, value / a};
            }
        }
        return null;
    }

    private String threeTermExpression(int value, int maxOperand, Random random) {
        int a = 2 + random.nextInt(8);
        int b = 2 + random.nextInt(8);
        int product = a * b;
        int difference = Math.abs(product - value);

        if (difference == 0) {
            return null;
        }
        if (difference <= maxOperand) {
            return product > value
                    ? a + " × " + b + " - " + difference
                    : a + " × " + b + " + " + difference;
        }

        int b2 = 2 + random.nextInt(8);
        int c2 = 2 + random.nextInt(8);
        int addend = value - (b2 * c2);
        if (addend >= 1 && addend <= maxOperand) {
            return addend + " + " + b2 + " × " + c2;
        }

        return null;
    }

    private List<OptionDto> buildOptions(int[] values, int level, Random random) {
        Set<Integer> correctValues = Arrays.stream(values).boxed().collect(Collectors.toSet());
        Set<Integer> optionValues = new LinkedHashSet<>(correctValues);

        int distractors = Math.min(6, 2 + level / 4);
        int attempts = 0;
        while (optionValues.size() < correctValues.size() + distractors && attempts++ < 300) {
            int anchor = values[random.nextInt(values.length)];
            int offset = 1 + random.nextInt(3);
            int candidate = random.nextBoolean() ? anchor + offset : anchor - offset;
            if (candidate < 1) {
                candidate = anchor + offset;
            }
            if (!correctValues.contains(candidate)) {
                optionValues.add(candidate);
            }
        }

        int maxValue = Arrays.stream(values).max().orElse(10);
        while (optionValues.size() < correctValues.size() + distractors) {
            int candidate = 1 + random.nextInt(maxValue + 20);
            if (!correctValues.contains(candidate)) {
                optionValues.add(candidate);
            }
        }

        List<Integer> shuffled = new ArrayList<>(optionValues);
        Collections.shuffle(shuffled, random);

        List<OptionDto> options = new ArrayList<>(shuffled.size());
        for (int i = 0; i < shuffled.size(); i++) {
            options.add(new OptionDto("o" + (i + 1), shuffled.get(i)));
        }
        return options;
    }

    private String cellId(int row, int col) {
        return "r" + row + "c" + col;
    }
}

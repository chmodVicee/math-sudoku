package com.mathsudoku.game;

import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class LevelGeneratorTest {

    private final LevelGenerator generator = new LevelGenerator();

    @Test
    void generaNivelesValidosYDeterministas() {
        long seed = 123_456_789L;
        GeneratedLevel first = generator.generate(7, seed);
        GeneratedLevel second = generator.generate(7, seed);

        assertThat(first).isEqualTo(second);
        assertThat(first.cells()).hasSize(16);
        assertThat(first.givenCount()).isBetween(2, 5);
    }

    @Test
    void cadaFilaYColumnaTieneResultadosDistintos() {
        for (int level = 1; level <= 25; level++) {
            for (long seed = 1; seed <= 10; seed++) {
                GeneratedLevel generated = generator.generate(level, seed);

                for (int row = 0; row < generated.size(); row++) {
                    Set<Integer> rowValues = new HashSet<>();
                    for (int col = 0; col < generated.size(); col++) {
                        rowValues.add(valueAt(generated, row, col));
                    }
                    assertThat(rowValues).hasSize(generated.size());
                }

                for (int col = 0; col < generated.size(); col++) {
                    Set<Integer> colValues = new HashSet<>();
                    for (int row = 0; row < generated.size(); row++) {
                        colValues.add(valueAt(generated, row, col));
                    }
                    assertThat(colValues).hasSize(generated.size());
                }
            }
        }
    }

    @Test
    void todasLasExpresionesResuelvenSuValorYLasOpcionesLoContienen() {
        for (int level = 1; level <= 40; level++) {
            for (long seed = 1; seed <= 15; seed++) {
                GeneratedLevel generated = generator.generate(level, seed);

                for (GeneratedCell cell : generated.cells()) {
                    assertThat(ExpressionEvaluator.evaluate(cell.expression()))
                            .as("expresión %s en nivel %d", cell.expression(), level)
                            .isEqualTo(cell.value());
                }

                Set<Integer> correctValues = new HashSet<>();
                generated.cells().forEach(cell -> correctValues.add(cell.value()));
                Set<Integer> optionValues = new HashSet<>();
                generated.options().forEach(option -> optionValues.add(option.value()));

                assertThat(optionValues).containsAll(correctValues);
                assertThat(generated.options()).hasSizeGreaterThan(correctValues.size());
            }
        }
    }

    @Test
    void noRepiteElMismoProblemaEnElTablero() {
        for (int level = 1; level <= 40; level++) {
            for (long seed = 1; seed <= 15; seed++) {
                GeneratedLevel generated = generator.generate(level, seed);

                Set<String> expressions = new HashSet<>();
                for (GeneratedCell cell : generated.cells()) {
                    assertThat(expressions.add(cell.expression()))
                            .as("expresión repetida %s en nivel %d con semilla %d",
                                    cell.expression(), level, seed)
                            .isTrue();
                }
            }
        }
    }

    @Test
    void losNivelesInicialesSonMasPequenosYConMasPistas() {
        GeneratedLevel easy = generator.generate(1, 42);
        GeneratedLevel advanced = generator.generate(15, 42);

        assertThat(easy.size()).isEqualTo(3);
        assertThat(advanced.size()).isEqualTo(4);
        assertThat(easy.givenCount()).isGreaterThanOrEqualTo(advanced.givenCount());
        assertThat(generator.generate(1, 1).cells().stream().filter(cell -> !cell.given()).count())
                .isGreaterThan(0);
    }

    private int valueAt(GeneratedLevel generated, int row, int col) {
        List<GeneratedCell> cells = generated.cells();
        return cells.get(row * generated.size() + col).value();
    }
}

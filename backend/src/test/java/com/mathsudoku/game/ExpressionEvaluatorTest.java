package com.mathsudoku.game;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ExpressionEvaluatorTest {

    @Test
    void respetaLaPrecedenciaDeOperaciones() {
        assertThat(ExpressionEvaluator.evaluate("2 + 3 × 4")).isEqualTo(14);
        assertThat(ExpressionEvaluator.evaluate("20 - 12 ÷ 3")).isEqualTo(16);
        assertThat(ExpressionEvaluator.evaluate("5 × 6 - 8")).isEqualTo(22);
    }

    @Test
    void resuelveOperacionesSimples() {
        assertThat(ExpressionEvaluator.evaluate("8 + 5")).isEqualTo(13);
        assertThat(ExpressionEvaluator.evaluate("15 - 7")).isEqualTo(8);
        assertThat(ExpressionEvaluator.evaluate("9 × 3")).isEqualTo(27);
        assertThat(ExpressionEvaluator.evaluate("56 ÷ 8")).isEqualTo(7);
    }

    @Test
    void rechazaDivisionesNoExactas() {
        assertThatThrownBy(() -> ExpressionEvaluator.evaluate("7 ÷ 2"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}

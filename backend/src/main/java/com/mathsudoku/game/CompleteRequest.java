package com.mathsudoku.game;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.util.Map;

public record CompleteRequest(
        @Positive(message = "Semilla inválida") long seed,

        @PositiveOrZero(message = "El tiempo no puede ser negativo")
        @Max(value = 86_400, message = "Tiempo fuera de rango")
        int elapsedSeconds,

        @NotNull(message = "La solución es obligatoria")
        Map<String, Integer> solution
) {
}

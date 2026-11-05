package com.mathsudoku.game;

import java.util.List;

public record GeneratedLevel(
        int level,
        int size,
        long seed,
        int givenCount,
        List<GeneratedCell> cells,
        List<OptionDto> options
) {
}

package com.mathsudoku.game;

import java.util.List;

public record LevelResponse(
        int level,
        int size,
        long seed,
        int givenCount,
        int emptyCount,
        List<CellDto> cells,
        List<OptionDto> options
) {
}

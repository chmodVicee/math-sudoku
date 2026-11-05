package com.mathsudoku.game;

import com.mathsudoku.progress.ProgressResponse;

import java.util.List;

public record CompleteResponse(
        boolean solved,
        List<String> wrongCells,
        Integer elapsedSeconds,
        Boolean newBest,
        ProgressResponse progress,
        String message
) {
}

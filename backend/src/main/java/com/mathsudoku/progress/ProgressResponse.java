package com.mathsudoku.progress;

import java.util.List;

public record ProgressResponse(
        int currentLevel,
        int highestLevel,
        int totalLevelsCompleted,
        long totalTimeSeconds,
        List<BestTimeDto> bestTimes
) {
}

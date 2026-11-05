package com.mathsudoku.progress;

import java.time.Instant;

public record BestTimeDto(int level, int bestSeconds, int attempts, Instant lastPlayedAt) {
}

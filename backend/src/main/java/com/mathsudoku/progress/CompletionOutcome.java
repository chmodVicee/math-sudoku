package com.mathsudoku.progress;

public record CompletionOutcome(ProgressResponse progress, boolean newBest) {
}

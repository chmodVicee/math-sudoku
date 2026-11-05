package com.mathsudoku.common;

import java.time.Instant;
import java.util.Map;

public record ApiError(
        int status,
        String message,
        Map<String, String> errors,
        Instant timestamp
) {
    public static ApiError of(int status, String message) {
        return new ApiError(status, message, null, Instant.now());
    }

    public static ApiError withErrors(int status, String message, Map<String, String> errors) {
        return new ApiError(status, message, errors, Instant.now());
    }
}

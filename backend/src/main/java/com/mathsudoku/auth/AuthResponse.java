package com.mathsudoku.auth;

public record AuthResponse(String token, UserDto user) {
}

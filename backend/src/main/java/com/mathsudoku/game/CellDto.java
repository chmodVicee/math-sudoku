package com.mathsudoku.game;

public record CellDto(String id, int row, int col, String expression, Integer value, boolean given) {
}

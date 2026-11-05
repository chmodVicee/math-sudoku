package com.mathsudoku.game;

import com.mathsudoku.common.ApiException;
import com.mathsudoku.progress.CompletionOutcome;
import com.mathsudoku.progress.Progress;
import com.mathsudoku.progress.ProgressService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class GameService {

    private static final long MAX_SEED = 1L << 52;
    private static final int MAX_LEVEL = 100_000;

    private final LevelGenerator levelGenerator;
    private final ProgressService progressService;

    public GameService(LevelGenerator levelGenerator, ProgressService progressService) {
        this.levelGenerator = levelGenerator;
        this.progressService = progressService;
    }

    @Transactional(readOnly = true)
    public LevelResponse getLevel(Long userId, int level) {
        Progress progress = progressService.findProgress(userId);
        assertUnlocked(level, progress);

        long seed = ThreadLocalRandom.current().nextLong(1, MAX_SEED);
        return toResponse(levelGenerator.generate(level, seed));
    }

    @Transactional
    public CompleteResponse completeLevel(Long userId, int level, CompleteRequest request) {
        if (request.seed() < 1 || request.seed() >= MAX_SEED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Semilla inválida");
        }

        Progress progress = progressService.findProgress(userId);
        assertUnlocked(level, progress);

        GeneratedLevel generated = levelGenerator.generate(level, request.seed());
        Map<String, Integer> solution = request.solution() == null ? Map.of() : request.solution();

        List<String> wrongCells = generated.cells().stream()
                .filter(cell -> !cell.given())
                .filter(cell -> !Objects.equals(solution.get(cell.id()), cell.value()))
                .map(GeneratedCell::id)
                .toList();

        if (!wrongCells.isEmpty()) {
            return new CompleteResponse(
                    false,
                    wrongCells,
                    null,
                    null,
                    null,
                    "Hay respuestas incorrectas. Corrige las casillas marcadas.");
        }

        int elapsedSeconds = Math.max(1, Math.min(request.elapsedSeconds(), 86_400));
        CompletionOutcome outcome = progressService.recordCompletion(userId, level, elapsedSeconds);

        return new CompleteResponse(
                true,
                List.of(),
                elapsedSeconds,
                outcome.newBest(),
                outcome.progress(),
                "¡Nivel completado!");
    }

    private void assertUnlocked(int level, Progress progress) {
        if (level < 1 || level > MAX_LEVEL) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Número de nivel inválido");
        }
        if (level > progress.getCurrentLevel()) {
            throw new ApiException(HttpStatus.CONFLICT, "Todavía no has desbloqueado este nivel");
        }
    }

    private LevelResponse toResponse(GeneratedLevel generated) {
        List<CellDto> cells = generated.cells().stream()
                .map(cell -> new CellDto(
                        cell.id(),
                        cell.row(),
                        cell.col(),
                        cell.expression(),
                        cell.given() ? cell.value() : null,
                        cell.given()))
                .toList();

        int emptyCount = (int) generated.cells().stream().filter(cell -> !cell.given()).count();

        return new LevelResponse(
                generated.level(),
                generated.size(),
                generated.seed(),
                generated.givenCount(),
                emptyCount,
                cells,
                generated.options());
    }
}

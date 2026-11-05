package com.mathsudoku.progress;

import com.mathsudoku.common.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class ProgressService {

    private static final int MAX_LEVEL_TIME_SECONDS = 86_400;

    private final ProgressRepository progressRepository;
    private final LevelResultRepository levelResultRepository;

    public ProgressService(ProgressRepository progressRepository, LevelResultRepository levelResultRepository) {
        this.progressRepository = progressRepository;
        this.levelResultRepository = levelResultRepository;
    }

    @Transactional
    public void createFor(Long userId) {
        Progress progress = new Progress();
        progress.setUserId(userId);
        progress.setCurrentLevel(1);
        progress.setHighestLevel(1);
        progress.setTotalLevelsCompleted(0);
        progress.setTotalTimeSeconds(0);
        progress.setUpdatedAt(Instant.now());
        progressRepository.save(progress);
    }

    @Transactional(readOnly = true)
    public ProgressResponse getProgress(Long userId) {
        return toResponse(findProgress(userId));
    }

    @Transactional(readOnly = true)
    public Progress findProgress(Long userId) {
        return progressRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No se encontró el progreso del usuario"));
    }

    @Transactional
    public CompletionOutcome recordCompletion(Long userId, int level, int elapsedSeconds) {
        Progress progress = findProgress(userId);

        if (level > progress.getCurrentLevel()) {
            throw new ApiException(HttpStatus.CONFLICT, "Todavía no has desbloqueado este nivel");
        }

        int safeElapsed = Math.max(1, Math.min(elapsedSeconds, MAX_LEVEL_TIME_SECONDS));
        Instant now = Instant.now();

        LevelResult result = levelResultRepository.findByUserIdAndLevel(userId, level)
                .orElseGet(() -> {
                    LevelResult created = new LevelResult();
                    created.setUserId(userId);
                    created.setLevel(level);
                    created.setAttempts(0);
                    created.setBestSeconds(safeElapsed);
                    return created;
                });

        boolean newBest = result.getId() == null || safeElapsed < result.getBestSeconds();
        boolean firstCompletion = result.getId() == null;
        if (newBest) {
            result.setBestSeconds(safeElapsed);
        }
        result.setAttempts(result.getAttempts() + 1);
        result.setLastPlayedAt(now);
        levelResultRepository.save(result);

        if (firstCompletion) {
            progress.setTotalLevelsCompleted(progress.getTotalLevelsCompleted() + 1);
        }
        progress.setTotalTimeSeconds(progress.getTotalTimeSeconds() + safeElapsed);
        if (level == progress.getCurrentLevel()) {
            int nextLevel = level + 1;
            progress.setCurrentLevel(nextLevel);
            progress.setHighestLevel(Math.max(progress.getHighestLevel(), nextLevel));
        }
        progress.setUpdatedAt(now);
        progressRepository.save(progress);

        return new CompletionOutcome(toResponse(progress), newBest);
    }

    private ProgressResponse toResponse(Progress progress) {
        List<BestTimeDto> bestTimes = levelResultRepository
                .findByUserIdOrderByLevelAsc(progress.getUserId())
                .stream()
                .map(result -> new BestTimeDto(
                        result.getLevel(),
                        result.getBestSeconds(),
                        result.getAttempts(),
                        result.getLastPlayedAt()))
                .toList();

        return new ProgressResponse(
                progress.getCurrentLevel(),
                progress.getHighestLevel(),
                progress.getTotalLevelsCompleted(),
                progress.getTotalTimeSeconds(),
                bestTimes);
    }
}

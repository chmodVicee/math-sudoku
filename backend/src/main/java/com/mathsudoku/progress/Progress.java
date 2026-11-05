package com.mathsudoku.progress;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "progress")
public class Progress {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "current_level", nullable = false)
    private int currentLevel = 1;

    @Column(name = "highest_level", nullable = false)
    private int highestLevel = 1;

    @Column(name = "total_levels_completed", nullable = false)
    private int totalLevelsCompleted;

    @Column(name = "total_time_seconds", nullable = false)
    private long totalTimeSeconds;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public int getCurrentLevel() {
        return currentLevel;
    }

    public void setCurrentLevel(int currentLevel) {
        this.currentLevel = currentLevel;
    }

    public int getHighestLevel() {
        return highestLevel;
    }

    public void setHighestLevel(int highestLevel) {
        this.highestLevel = highestLevel;
    }

    public int getTotalLevelsCompleted() {
        return totalLevelsCompleted;
    }

    public void setTotalLevelsCompleted(int totalLevelsCompleted) {
        this.totalLevelsCompleted = totalLevelsCompleted;
    }

    public long getTotalTimeSeconds() {
        return totalTimeSeconds;
    }

    public void setTotalTimeSeconds(long totalTimeSeconds) {
        this.totalTimeSeconds = totalTimeSeconds;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}

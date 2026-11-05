package com.mathsudoku.progress;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LevelResultRepository extends JpaRepository<LevelResult, Long> {

    Optional<LevelResult> findByUserIdAndLevel(Long userId, int level);

    List<LevelResult> findByUserIdOrderByLevelAsc(Long userId);
}

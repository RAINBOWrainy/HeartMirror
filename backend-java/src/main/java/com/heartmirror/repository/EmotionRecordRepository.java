package com.heartmirror.repository;

import com.heartmirror.entity.EmotionRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EmotionRecordRepository extends JpaRepository<EmotionRecord, Long> {
    List<EmotionRecord> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<EmotionRecord> findByUserId(Long userId);
    List<EmotionRecord> findByUserIdAndCreatedAtBetweenOrderByCreatedAtDesc(
            Long userId, LocalDateTime start, LocalDateTime end);

    @Query("SELECT e.primaryEmotion, COUNT(e) FROM EmotionRecord e WHERE e.userId = ?1 GROUP BY e.primaryEmotion")
    List<Object[]> countByPrimaryEmotion(Long userId);

    @Query("SELECT AVG(e.intensity) FROM EmotionRecord e WHERE e.userId = ?1")
    Double getAverageIntensity(Long userId);
}
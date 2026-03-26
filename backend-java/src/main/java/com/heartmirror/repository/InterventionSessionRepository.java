package com.heartmirror.repository;

import com.heartmirror.entity.InterventionSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 干预会话Repository
 */
@Repository
public interface InterventionSessionRepository extends JpaRepository<InterventionSession, Long> {

    List<InterventionSession> findByUserIdOrderByStartedAtDesc(Long userId);

    List<InterventionSession> findByPlanIdOrderByStartedAtDesc(Long planId);

    Optional<InterventionSession> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT COUNT(s) FROM InterventionSession s WHERE s.userId = ?1 AND s.isCompleted = true")
    Long countCompletedByUserId(Long userId);

    @Query("SELECT COUNT(s) FROM InterventionSession s WHERE s.userId = ?1")
    Long countByUserId(Long userId);

    @Query("SELECT s FROM InterventionSession s WHERE s.userId = ?1 ORDER BY s.startedAt DESC LIMIT 1")
    Optional<InterventionSession> findLatestByUserId(Long userId);
}
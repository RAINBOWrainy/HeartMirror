package com.heartmirror.repository;

import com.heartmirror.entity.QuestionnaireSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 问卷会话Repository
 */
@Repository
public interface QuestionnaireSessionRepository extends JpaRepository<QuestionnaireSession, Long> {

    List<QuestionnaireSession> findByUserIdOrderByStartedAtDesc(Long userId);

    Optional<QuestionnaireSession> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT s FROM QuestionnaireSession s WHERE s.userId = ?1 AND s.questionnaireType = ?2 AND s.isCompleted = true ORDER BY s.completedAt DESC LIMIT 1")
    Optional<QuestionnaireSession> findLatestCompletedByType(Long userId, String type);

    @Query("SELECT COUNT(s) FROM QuestionnaireSession s WHERE s.userId = ?1 AND s.isCompleted = true")
    Long countCompletedByUserId(Long userId);

    @Query("SELECT s FROM QuestionnaireSession s WHERE s.userId = ?1 AND s.isCompleted = true ORDER BY s.completedAt DESC")
    List<QuestionnaireSession> findCompletedByUserId(Long userId);
}
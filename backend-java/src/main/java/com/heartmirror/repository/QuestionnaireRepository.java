package com.heartmirror.repository;

import com.heartmirror.entity.Questionnaire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuestionnaireRepository extends JpaRepository<Questionnaire, Long> {
    List<Questionnaire> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Questionnaire> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT q.riskLevel, COUNT(q) FROM Questionnaire q WHERE q.userId = ?1 GROUP BY q.riskLevel")
    List<Object[]> countByRiskLevel(Long userId);
}
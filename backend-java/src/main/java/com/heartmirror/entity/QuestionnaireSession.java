package com.heartmirror.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 问卷会话实体
 * 记录每次问卷评估的详情
 */
@Entity
@Table(name = "questionnaire_sessions", indexes = {
        @Index(name = "idx_questionnaire_session_user_id", columnList = "user_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionnaireSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "questionnaire_type", nullable = false, length = 20)
    private String questionnaireType; // phq9, gad7, dass21

    @Column(name = "current_question_index")
    private Integer currentQuestionIndex = 0;

    @Column(name = "total_score")
    private Integer totalScore;

    @Column(name = "max_score")
    private Integer maxScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", length = 20)
    private RiskLevel riskLevel = RiskLevel.GREEN;

    @Column(columnDefinition = "TEXT")
    private String answers; // JSON格式存储答案

    @Column(name = "dimension_scores", columnDefinition = "TEXT")
    private String dimensionScores; // JSON格式存储维度分数

    @Column(name = "is_completed")
    private Boolean isCompleted = false;

    @Column(columnDefinition = "TEXT")
    private String interpretation;

    @Column(name = "mode", length = 20)
    private String mode = "conversational"; // conversational 或 form

    @CreationTimestamp
    @Column(name = "started_at", updatable = false)
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    public enum RiskLevel {
        GREEN, YELLOW, ORANGE, RED
    }
}
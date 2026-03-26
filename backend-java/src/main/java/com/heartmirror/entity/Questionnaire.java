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
 * 问卷评估实体
 */
@Entity
@Table(name = "questionnaires", indexes = {
        @Index(name = "idx_questionnaire_user_id", columnList = "user_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Questionnaire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "session_id")
    private Long sessionId;

    @Column(nullable = false, length = 100)
    private String type; // PHQ-9, GAD-7, conversational, etc.

    @Column(name = "assessment_type", length = 50)
    private String assessmentType;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", length = 20)
    private RiskLevel riskLevel = RiskLevel.GREEN;

    @Column(name = "risk_score")
    private Double riskScore;

    @Column(name = "total_score")
    private Integer totalScore;

    @Column(name = "max_score")
    private Integer maxScore;

    @Column(columnDefinition = "TEXT")
    private String answers; // JSON

    @Column(columnDefinition = "TEXT")
    private String results; // JSON

    @Column(name = "detected_symptoms", columnDefinition = "TEXT")
    private String detectedSymptoms; // JSON array

    @Column(name = "ai_analysis", columnDefinition = "TEXT")
    private String aiAnalysis;

    @Column(name = "recommendations", columnDefinition = "TEXT")
    private String recommendations; // JSON

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Status status = Status.COMPLETED;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum RiskLevel {
        GREEN, YELLOW, ORANGE, RED
    }

    public enum Status {
        IN_PROGRESS, COMPLETED, CANCELLED
    }
}
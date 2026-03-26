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
 * 干预方案实体
 */
@Entity
@Table(name = "interventions", indexes = {
        @Index(name = "idx_intervention_user_id", columnList = "user_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Intervention {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "intervention_type", length = 50)
    private String interventionType; // mindfulness, cbt, exercise, etc.

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", length = 20)
    private RiskLevel riskLevel = RiskLevel.GREEN;

    @Column(name = "target_emotions", length = 500)
    private String targetEmotions; // JSON array

    @Column(name = "steps", columnDefinition = "TEXT")
    private String steps; // JSON array

    @Column(name = "evidence_base", columnDefinition = "TEXT")
    private String evidenceBase;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "frequency")
    private String frequency;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Status status = Status.ACTIVE;

    @Column(name = "effectiveness_score")
    private Double effectivenessScore;

    @Column(name = "completion_count")
    private Integer completionCount = 0;

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
        ACTIVE, COMPLETED, PAUSED, CANCELLED
    }
}
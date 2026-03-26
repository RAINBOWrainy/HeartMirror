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
 * 干预会话实体
 * 记录每次干预执行的详情
 */
@Entity
@Table(name = "intervention_sessions", indexes = {
        @Index(name = "idx_intervention_session_user_id", columnList = "user_id"),
        @Index(name = "idx_intervention_session_plan_id", columnList = "plan_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterventionSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "plan_id", nullable = false)
    private Long planId;

    @Column(name = "emotion_before", length = 30)
    private String emotionBefore;

    @Column(name = "intensity_before")
    private Double intensityBefore;

    @Column(name = "emotion_after", length = 30)
    private String emotionAfter;

    @Column(name = "intensity_after")
    private Double intensityAfter;

    @Column(name = "user_rating")
    private Integer userRating; // 1-5

    @Column(name = "actual_duration")
    private Integer actualDuration; // 实际用时（分钟）

    @Column(columnDefinition = "TEXT")
    private String feedback;

    @Column(name = "is_completed")
    private Boolean isCompleted = false;

    @CreationTimestamp
    @Column(name = "started_at", updatable = false)
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
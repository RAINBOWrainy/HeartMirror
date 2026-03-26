package com.heartmirror.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 情绪记录实体
 */
@Entity
@Table(name = "emotion_records", indexes = {
        @Index(name = "idx_user_id", columnList = "user_id"),
        @Index(name = "idx_created_at", columnList = "created_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmotionRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "primary_emotion", nullable = false, length = 30)
    private String primaryEmotion;

    @Column(nullable = false)
    private Double intensity;

    private Double confidence;

    @Column(name = "secondary_emotions", length = 200)
    private String secondaryEmotions; // JSON array

    @Column(length = 500)
    private String source;

    @Column(columnDefinition = "TEXT")
    private String context;

    @Column(name = "suggested_tone", length = 50)
    private String suggestedTone;

    @Column(name = "risk_level", length = 20)
    private String riskLevel = "green";

    @Column(name = "session_id")
    private Long sessionId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
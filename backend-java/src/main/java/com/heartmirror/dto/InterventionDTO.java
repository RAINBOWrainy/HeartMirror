package com.heartmirror.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * 干预计划DTO
 */
public class InterventionDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlanResponse {
        private Long id;
        private String name;
        private String title;
        private String description;
        private String interventionType;
        private Integer difficultyLevel;
        private Integer estimatedDuration;
        private Boolean isActive;
        private Double effectivenessScore;
        private List<String> targetEmotions;
        private List<String> steps;
        private String createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StartSessionRequest {
        private String emotionBefore;
        private Double intensityBefore;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CompleteSessionRequest {
        @Min(1) @Max(5)
        private Integer userRating;
        private String emotionAfter;
        private Double intensityAfter;
        private Integer actualDuration;
        private String feedback;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SessionResponse {
        private Long id;
        private Long planId;
        private Boolean isCompleted;
        private String emotionBefore;
        private String emotionAfter;
        private Double intensityBefore;
        private Double intensityAfter;
        private Integer userRating;
        private String startedAt;
        private String completedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatsResponse {
        private Long totalPlans;
        private Long activePlans;
        private Long completedSessions;
        private Long totalSessions;
        private Double completionRate;
        private Map<String, Long> byType;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecommendationResponse {
        private Long planId;
        private String title;
        private String description;
        private String interventionType;
        private Integer estimatedDuration;
        private Double relevanceScore;
        private String reason;
    }
}
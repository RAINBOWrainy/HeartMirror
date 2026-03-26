package com.heartmirror.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * 数据看板DTO
 */
public class DashboardDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DashboardResponse {
        private Overview overview;
        private List<EmotionTrendPoint> emotionTrend;
        private Map<String, Integer> emotionDistribution;
        private InterventionStats interventionStats;
        private QuestionnaireStats questionnaireStats;
        private List<Activity> recentActivities;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Overview {
        private Long totalSessions;
        private Long totalDiaries;
        private Long totalInterventions;
        private Integer currentStreak;
        private String riskLevel;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmotionTrendPoint {
        private String date;
        private Double averageIntensity;
        private String dominantEmotion;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InterventionStats {
        private Long total;
        private Long completed;
        private Double completionRate;
        private Map<String, Long> byType;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionnaireStats {
        private Long totalSessions;
        private Long completedSessions;
        private Integer latestPhq9Score;
        private Integer latestGad7Score;
        private Map<String, Long> byType;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Activity {
        private String type;
        private String title;
        private String timestamp;
        private Double intensity;
    }
}
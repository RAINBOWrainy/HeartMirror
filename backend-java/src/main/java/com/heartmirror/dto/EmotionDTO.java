package com.heartmirror.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class EmotionDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmotionResult {
        private String primaryEmotion;
        private Double intensity;
        private Double confidence;
        private List<String> secondaryEmotions;
        private String reasoning;
        private String suggestedTone;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmotionRecordDTO {
        private Long id;
        private String primaryEmotion;
        private Double intensity;
        private Double confidence;
        private String secondaryEmotions;
        private String source;
        private String context;
        private String riskLevel;
        private String createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmotionStats {
        private Long totalRecords;
        private Double averageIntensity;
        private List<EmotionCount> emotionCounts;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmotionCount {
        private String emotion;
        private Long count;
    }
}
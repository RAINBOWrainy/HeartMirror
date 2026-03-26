package com.heartmirror.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * 问卷评估DTO
 */
public class QuestionnaireDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TypeResponse {
        private String id;
        private String name;
        private String description;
        private Integer questionCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TypeDetailResponse {
        private String id;
        private String name;
        private String description;
        private List<Question> questions;
        private List<Option> options;
        private Integer questionCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Question {
        private Integer index;
        private String text;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Option {
        private Integer value;
        private String label;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StartRequest {
        @NotBlank(message = "问卷类型不能为空")
        private String questionnaireType;
        private String mode = "conversational";
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnswerRequest {
        @NotNull(message = "会话ID不能为空")
        private Long sessionId;
        @NotNull(message = "问题索引不能为空")
        private Integer questionIndex;
        @Min(0) @Max(3)
        @NotNull(message = "答案值不能为空")
        private Integer answerValue;
        private String answerText;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SessionResponse {
        private Long id;
        private String questionnaireType;
        private Integer currentQuestionIndex;
        private Integer totalQuestions;
        private Boolean isCompleted;
        private Integer totalScore;
        private String riskLevel;
        private String startedAt;
        private String completedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResultResponse {
        private Long sessionId;
        private String questionnaireType;
        private Integer totalScore;
        private Integer maxScore;
        private String riskLevel;
        private String interpretation;
        private Map<String, Integer> dimensionScores;
        private List<String> recommendations;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HistoryItem {
        private Long id;
        private String questionnaireType;
        private Integer totalScore;
        private String riskLevel;
        private Boolean isCompleted;
        private String startedAt;
        private String completedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SessionDetailResponse {
        private Long id;
        private String questionnaireType;
        private Boolean isCompleted;
        private CurrentQuestion currentQuestion;
        private Progress progress;
        private String startedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CurrentQuestion {
        private Integer index;
        private String text;
        private List<Option> options;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Progress {
        private Integer current;
        private Integer total;
    }
}
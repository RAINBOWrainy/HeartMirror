package com.heartmirror.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * 日记DTO
 */
public class DiaryDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        @NotBlank(message = "日记内容不能为空")
        private String content;
        private String mood;
        private List<String> tags;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        private String content;
        private String mood;
        private List<String> tags;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DiaryResponse {
        private Long id;
        private LocalDate date;
        private String title;
        private String content;
        private String mood;
        private Integer moodScore;
        private String emotionAnalysis;
        private List<String> tags;
        private String createdAt;
        private String updatedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DiaryListResponse {
        private Long id;
        private LocalDate date;
        private String title;
        private String mood;
        private Integer moodScore;
        private String createdAt;
    }
}
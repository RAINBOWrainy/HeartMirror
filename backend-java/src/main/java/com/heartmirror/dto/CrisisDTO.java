package com.heartmirror.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * 危机支持DTO
 */
public class CrisisDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CrisisResource {
        private String name;
        private String phone;
        private String description;
        private String availableHours;
        private String region;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HotlineResponse {
        private String nationalHotline;
        private String emergency;
        private String police;
        private String message;
        private List<CrisisResource> regionalHotlines;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImmediateHelpResponse {
        private String message;
        private List<CrisisResource> resources;
        private List<String> immediateActions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GroundingExercise {
        private String name;
        private String description;
        private List<String> steps;
        private String duration;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GroundingExercisesResponse {
        private List<GroundingExercise> exercises;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SafetyPlanResponse {
        private String message;
        private List<SafetyPlanStep> steps;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SafetyPlanStep {
        private Integer step;
        private String title;
        private String description;
        private List<String> examples;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResourcesResponse {
        private String message;
        private List<CrisisResource> hotlines;
        private List<CrisisResource> onlineResources;
    }
}
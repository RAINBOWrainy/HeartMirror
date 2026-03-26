package com.heartmirror.controller;

import com.heartmirror.dto.ApiResponse;
import com.heartmirror.dto.InterventionDTO;
import com.heartmirror.service.AuthService;
import com.heartmirror.service.InterventionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 干预计划控制器
 */
@Tag(name = "干预计划", description = "个性化心理健康干预方案接口")
@RestController
@RequestMapping("/api/intervention")
@RequiredArgsConstructor
public class InterventionController {

    private final InterventionService interventionService;
    private final AuthService authService;

    @Operation(summary = "获取干预计划列表")
    @GetMapping("/plans")
    public ApiResponse<List<InterventionDTO.PlanResponse>> getPlans(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false, defaultValue = "false") boolean activeOnly,
            @RequestParam(required = false, defaultValue = "20") int limit) {
        try {
            Long userId = authService.getCurrentUser(userDetails.getUsername()).getId();
            List<InterventionDTO.PlanResponse> plans = interventionService.getPlans(userId, activeOnly, limit);
            return ApiResponse.success(plans);
        } catch (Exception e) {
            return ApiResponse.error("获取干预计划失败", e.getMessage());
        }
    }

    @Operation(summary = "获取单个计划")
    @GetMapping("/plans/{id}")
    public ApiResponse<InterventionDTO.PlanResponse> getPlan(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        try {
            Long userId = authService.getCurrentUser(userDetails.getUsername()).getId();
            return ApiResponse.success(interventionService.getPlanById(userId, id));
        } catch (Exception e) {
            return ApiResponse.error("获取干预计划失败", e.getMessage());
        }
    }

    @Operation(summary = "开始干预会话")
    @PostMapping("/plans/{id}/start")
    public ApiResponse<InterventionDTO.SessionResponse> startSession(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @RequestBody(required = false) InterventionDTO.StartSessionRequest request) {
        try {
            Long userId = authService.getCurrentUser(userDetails.getUsername()).getId();
            InterventionDTO.SessionResponse response = interventionService.startSession(userId, id, request);
            return ApiResponse.success(response);
        } catch (Exception e) {
            return ApiResponse.error("开始干预会话失败", e.getMessage());
        }
    }

    @Operation(summary = "完成干预会话")
    @PostMapping("/sessions/{id}/complete")
    public ApiResponse<InterventionDTO.SessionResponse> completeSession(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody InterventionDTO.CompleteSessionRequest request) {
        try {
            Long userId = authService.getCurrentUser(userDetails.getUsername()).getId();
            InterventionDTO.SessionResponse response = interventionService.completeSession(userId, id, request);
            return ApiResponse.success(response);
        } catch (Exception e) {
            return ApiResponse.error("完成干预会话失败", e.getMessage());
        }
    }

    @Operation(summary = "获取推荐")
    @GetMapping("/recommendations")
    public ApiResponse<List<InterventionDTO.RecommendationResponse>> getRecommendations(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String emotion,
            @RequestParam(required = false) Double intensity,
            @RequestParam(required = false, defaultValue = "5") int limit) {
        try {
            Long userId = authService.getCurrentUser(userDetails.getUsername()).getId();
            List<InterventionDTO.RecommendationResponse> recommendations =
                    interventionService.getRecommendations(userId, emotion, intensity, limit);
            return ApiResponse.success(recommendations);
        } catch (Exception e) {
            return ApiResponse.error("获取推荐失败", e.getMessage());
        }
    }

    @Operation(summary = "获取统计数据")
    @GetMapping("/stats")
    public ApiResponse<InterventionDTO.StatsResponse> getStats(
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            Long userId = authService.getCurrentUser(userDetails.getUsername()).getId();
            return ApiResponse.success(interventionService.getStats(userId));
        } catch (Exception e) {
            return ApiResponse.error("获取统计数据失败", e.getMessage());
        }
    }
}
package com.heartmirror.controller;

import com.heartmirror.dto.ApiResponse;
import com.heartmirror.dto.QuestionnaireDTO;
import com.heartmirror.service.AuthService;
import com.heartmirror.service.QuestionnaireService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 问卷评估控制器
 */
@Tag(name = "问卷评估", description = "心理健康评估问卷接口（PHQ-9、GAD-7、DASS-21）")
@RestController
@RequestMapping("/api/questionnaire")
@RequiredArgsConstructor
public class QuestionnaireController {

    private final QuestionnaireService questionnaireService;
    private final AuthService authService;

    @Operation(summary = "获取问卷类型列表")
    @GetMapping("/types")
    public ApiResponse<List<QuestionnaireDTO.TypeResponse>> getTypes() {
        return ApiResponse.success(questionnaireService.getTypes());
    }

    @Operation(summary = "获取问卷详情")
    @GetMapping("/types/{type}")
    public ApiResponse<QuestionnaireDTO.TypeDetailResponse> getTypeDetail(@PathVariable String type) {
        try {
            return ApiResponse.success(questionnaireService.getTypeDetail(type));
        } catch (Exception e) {
            return ApiResponse.error("获取问卷详情失败", e.getMessage());
        }
    }

    @Operation(summary = "开始评估")
    @PostMapping("/start")
    public ApiResponse<QuestionnaireDTO.SessionResponse> startQuestionnaire(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody QuestionnaireDTO.StartRequest request) {
        try {
            Long userId = authService.getCurrentUser(userDetails.getUsername()).getId();
            QuestionnaireDTO.SessionResponse response = questionnaireService.startQuestionnaire(userId, request);
            return ApiResponse.success(response);
        } catch (Exception e) {
            return ApiResponse.error("开始评估失败", e.getMessage());
        }
    }

    @Operation(summary = "提交答案")
    @PostMapping("/answer")
    public ApiResponse<QuestionnaireDTO.SessionResponse> submitAnswer(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody QuestionnaireDTO.AnswerRequest request) {
        try {
            Long userId = authService.getCurrentUser(userDetails.getUsername()).getId();
            QuestionnaireDTO.SessionResponse response = questionnaireService.submitAnswer(userId, request);
            return ApiResponse.success(response);
        } catch (Exception e) {
            return ApiResponse.error("提交答案失败", e.getMessage());
        }
    }

    @Operation(summary = "获取会话详情")
    @GetMapping("/sessions/{id}")
    public ApiResponse<QuestionnaireDTO.SessionDetailResponse> getSession(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        try {
            Long userId = authService.getCurrentUser(userDetails.getUsername()).getId();
            return ApiResponse.success(questionnaireService.getSession(userId, id));
        } catch (Exception e) {
            return ApiResponse.error("获取会话失败", e.getMessage());
        }
    }

    @Operation(summary = "获取评估结果")
    @GetMapping("/sessions/{id}/result")
    public ApiResponse<QuestionnaireDTO.ResultResponse> getResult(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        try {
            Long userId = authService.getCurrentUser(userDetails.getUsername()).getId();
            return ApiResponse.success(questionnaireService.getResult(userId, id));
        } catch (Exception e) {
            return ApiResponse.error("获取结果失败", e.getMessage());
        }
    }

    @Operation(summary = "获取历史记录")
    @GetMapping("/history")
    public ApiResponse<List<QuestionnaireDTO.HistoryItem>> getHistory(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false, defaultValue = "10") int limit) {
        try {
            Long userId = authService.getCurrentUser(userDetails.getUsername()).getId();
            return ApiResponse.success(questionnaireService.getHistory(userId, limit));
        } catch (Exception e) {
            return ApiResponse.error("获取历史失败", e.getMessage());
        }
    }
}
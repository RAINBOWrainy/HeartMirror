package com.heartmirror.controller;

import com.heartmirror.dto.ApiResponse;
import com.heartmirror.dto.EmotionDTO;
import com.heartmirror.service.AuthService;
import com.heartmirror.service.EmotionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 情绪控制器
 */
@Tag(name = "情绪", description = "情绪识别与分析接口")
@RestController
@RequestMapping("/api/emotion")
@RequiredArgsConstructor
public class EmotionController {

    private final EmotionService emotionService;
    private final AuthService authService;

    @Operation(summary = "分析文本情绪")
    @PostMapping("/analyze")
    public ApiResponse<EmotionDTO.EmotionResult> analyzeEmotion(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> request) {
        try {
            Long userId = authService.getCurrentUser(userDetails.getUsername()).getId();
            String text = request.get("text");
            String source = request.getOrDefault("source", "chat");

            EmotionDTO.EmotionResult result = emotionService.analyzeAndRecord(userId, text, source, null);
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error("情绪分析失败", e.getMessage());
        }
    }

    @Operation(summary = "快速情绪识别")
    @PostMapping("/quick-analyze")
    public ApiResponse<EmotionDTO.EmotionResult> quickAnalyze(@RequestBody Map<String, String> request) {
        String text = request.get("text");
        EmotionDTO.EmotionResult result = emotionService.quickAnalyze(text);
        return ApiResponse.success(result);
    }

    @Operation(summary = "获取情绪记录")
    @GetMapping("/records")
    public ApiResponse<List<EmotionDTO.EmotionRecordDTO>> getEmotionRecords(
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            Long userId = authService.getCurrentUser(userDetails.getUsername()).getId();
            List<EmotionDTO.EmotionRecordDTO> records = emotionService.getUserEmotionRecords(userId);
            return ApiResponse.success(records);
        } catch (Exception e) {
            return ApiResponse.error("获取情绪记录失败", e.getMessage());
        }
    }

    @Operation(summary = "获取情绪统计")
    @GetMapping("/stats")
    public ApiResponse<EmotionDTO.EmotionStats> getEmotionStats(
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            Long userId = authService.getCurrentUser(userDetails.getUsername()).getId();
            EmotionDTO.EmotionStats stats = emotionService.getEmotionStats(userId);
            return ApiResponse.success(stats);
        } catch (Exception e) {
            return ApiResponse.error("获取情绪统计失败", e.getMessage());
        }
    }
}
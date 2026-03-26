package com.heartmirror.controller;

import com.heartmirror.dto.AISettingDTO;
import com.heartmirror.dto.ApiResponse;
import com.heartmirror.entity.AISetting;
import com.heartmirror.service.AuthService;
import com.heartmirror.service.LlmService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * AI设置控制器
 * 用户可以在此配置自己的AI API Key、Base URL和模型
 */
@Tag(name = "AI设置", description = "用户自定义AI配置接口")
@RestController
@RequestMapping("/api/settings/ai")
@RequiredArgsConstructor
public class SettingsController {

    private final LlmService llmService;
    private final AuthService authService;

    @Operation(summary = "获取AI设置")
    @GetMapping
    public ApiResponse<AISettingDTO.SettingResponse> getAISettings(
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            Long userId = authService.getCurrentUser(userDetails.getUsername()).getId();
            AISetting setting = llmService.getUserAISetting(userId);

            if (setting == null) {
                return ApiResponse.success(AISettingDTO.SettingResponse.builder()
                        .isActive(false)
                        .build());
            }

            // 脱敏显示API Key
            String maskedApiKey = null;
            if (setting.getApiKey() != null && setting.getApiKey().length() > 8) {
                maskedApiKey = setting.getApiKey().substring(0, 4) + "****" +
                        setting.getApiKey().substring(setting.getApiKey().length() - 4);
            }

            return ApiResponse.success(AISettingDTO.SettingResponse.builder()
                    .id(setting.getId())
                    .apiKey(maskedApiKey)
                    .baseUrl(setting.getBaseUrl())
                    .model(setting.getModel())
                    .temperature(setting.getTemperature())
                    .maxTokens(setting.getMaxTokens())
                    .isActive(setting.getIsActive())
                    .createdAt(setting.getCreatedAt() != null ? setting.getCreatedAt().toString() : null)
                    .updatedAt(setting.getUpdatedAt() != null ? setting.getUpdatedAt().toString() : null)
                    .build());
        } catch (Exception e) {
            return ApiResponse.error("获取AI设置失败", e.getMessage());
        }
    }

    @Operation(summary = "更新AI设置")
    @PostMapping
    public ApiResponse<AISettingDTO.SettingResponse> updateAISettings(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody AISettingDTO.UpdateRequest request) {
        try {
            Long userId = authService.getCurrentUser(userDetails.getUsername()).getId();
            AISetting setting = llmService.saveAISetting(userId, request);

            return ApiResponse.success("AI设置已保存", AISettingDTO.SettingResponse.builder()
                    .id(setting.getId())
                    .baseUrl(setting.getBaseUrl())
                    .model(setting.getModel())
                    .temperature(setting.getTemperature())
                    .maxTokens(setting.getMaxTokens())
                    .isActive(true)
                    .build());
        } catch (Exception e) {
            return ApiResponse.error("保存AI设置失败", e.getMessage());
        }
    }

    @Operation(summary = "测试AI连接")
    @PostMapping("/test")
    public ApiResponse<AISettingDTO.TestResponse> testAIConnection(
            @RequestBody AISettingDTO.TestRequest request) {
        try {
            AISettingDTO.TestResponse response = llmService.testConnection(request);
            return ApiResponse.success(response);
        } catch (Exception e) {
            return ApiResponse.error("测试连接失败", e.getMessage());
        }
    }

    @Operation(summary = "删除AI设置")
    @DeleteMapping
    public ApiResponse<Void> deleteAISettings(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            Long userId = authService.getCurrentUser(userDetails.getUsername()).getId();
            // 重置为默认设置
            AISettingDTO.UpdateRequest emptyRequest = AISettingDTO.UpdateRequest.builder()
                    .apiKey(null)
                    .baseUrl(null)
                    .model(null)
                    .build();
            llmService.saveAISetting(userId, emptyRequest);
            return ApiResponse.success("AI设置已清除", null);
        } catch (Exception e) {
            return ApiResponse.error("删除AI设置失败", e.getMessage());
        }
    }
}
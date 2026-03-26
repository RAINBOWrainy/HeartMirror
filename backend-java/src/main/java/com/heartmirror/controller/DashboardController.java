package com.heartmirror.controller;

import com.heartmirror.dto.ApiResponse;
import com.heartmirror.dto.DashboardDTO;
import com.heartmirror.service.AuthService;
import com.heartmirror.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * 数据看板控制器
 */
@Tag(name = "数据看板", description = "用户活动统计和数据分析接口")
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final AuthService authService;

    @Operation(summary = "获取看板数据")
    @GetMapping
    public ApiResponse<DashboardDTO.DashboardResponse> getDashboard(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false, defaultValue = "30") int days) {
        try {
            Long userId = authService.getCurrentUser(userDetails.getUsername()).getId();
            DashboardDTO.DashboardResponse dashboard = dashboardService.getDashboard(userId, days);
            return ApiResponse.success(dashboard);
        } catch (Exception e) {
            return ApiResponse.error("获取看板数据失败", e.getMessage());
        }
    }
}
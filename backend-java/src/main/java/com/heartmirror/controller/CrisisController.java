package com.heartmirror.controller;

import com.heartmirror.dto.ApiResponse;
import com.heartmirror.dto.CrisisDTO;
import com.heartmirror.service.CrisisService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 危机支持控制器
 * 提供心理危机热线、接地练习等资源
 */
@Tag(name = "危机支持", description = "心理危机热线、接地练习、安全计划等资源")
@RestController
@RequestMapping("/api/crisis")
@RequiredArgsConstructor
public class CrisisController {

    private final CrisisService crisisService;

    @Operation(summary = "获取危机资源", description = "获取心理援助热线和在线资源列表")
    @GetMapping("/resources")
    public ApiResponse<CrisisDTO.ResourcesResponse> getResources() {
        return ApiResponse.success(crisisService.getResources());
    }

    @Operation(summary = "获取热线信息", description = "获取全国及地区心理援助热线（公开访问）")
    @GetMapping("/hotline")
    public ApiResponse<CrisisDTO.HotlineResponse> getHotline() {
        return ApiResponse.success(crisisService.getHotline());
    }

    @Operation(summary = "获取安全计划", description = "获取安全计划模板，帮助用户制定个人安全计划")
    @GetMapping("/safety-plan")
    public ApiResponse<CrisisDTO.SafetyPlanResponse> getSafetyPlan() {
        return ApiResponse.success(crisisService.getSafetyPlan());
    }

    @Operation(summary = "获取即时帮助", description = "获取即时危机应对建议")
    @GetMapping("/immediate-help")
    public ApiResponse<CrisisDTO.ImmediateHelpResponse> getImmediateHelp() {
        return ApiResponse.success(crisisService.getImmediateHelp());
    }

    @Operation(summary = "获取接地练习", description = "获取接地练习指南（公开访问）")
    @GetMapping("/grounding-exercises")
    public ApiResponse<CrisisDTO.GroundingExercisesResponse> getGroundingExercises() {
        return ApiResponse.success(crisisService.getGroundingExercises());
    }
}
package com.heartmirror.controller;

import com.heartmirror.dto.ApiResponse;
import com.heartmirror.dto.DiaryDTO;
import com.heartmirror.service.AuthService;
import com.heartmirror.service.DiaryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 日记控制器
 */
@Tag(name = "日记", description = "情绪日记管理接口")
@RestController
@RequestMapping("/api/diary")
@RequiredArgsConstructor
public class DiaryController {

    private final DiaryService diaryService;
    private final AuthService authService;

    @Operation(summary = "创建日记")
    @PostMapping
    public ApiResponse<DiaryDTO.DiaryResponse> createDiary(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody DiaryDTO.CreateRequest request) {
        try {
            Long userId = authService.getCurrentUser(userDetails.getUsername()).getId();
            DiaryDTO.DiaryResponse response = diaryService.createDiary(userId, request);
            return ApiResponse.success(response);
        } catch (Exception e) {
            return ApiResponse.error("创建日记失败", e.getMessage());
        }
    }

    @Operation(summary = "获取日记列表")
    @GetMapping
    public ApiResponse<List<DiaryDTO.DiaryListResponse>> getDiaryList(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false, defaultValue = "20") int limit,
            @RequestParam(required = false, defaultValue = "0") int offset) {
        try {
            Long userId = authService.getCurrentUser(userDetails.getUsername()).getId();
            List<DiaryDTO.DiaryListResponse> diaries = diaryService.getDiaryList(userId, limit, offset);
            return ApiResponse.success(diaries);
        } catch (Exception e) {
            return ApiResponse.error("获取日记列表失败", e.getMessage());
        }
    }

    @Operation(summary = "获取日记详情")
    @GetMapping("/{id}")
    public ApiResponse<DiaryDTO.DiaryResponse> getDiary(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        try {
            Long userId = authService.getCurrentUser(userDetails.getUsername()).getId();
            DiaryDTO.DiaryResponse diary = diaryService.getDiaryById(userId, id);
            return ApiResponse.success(diary);
        } catch (Exception e) {
            return ApiResponse.error("获取日记失败", e.getMessage());
        }
    }

    @Operation(summary = "更新日记")
    @PutMapping("/{id}")
    public ApiResponse<DiaryDTO.DiaryResponse> updateDiary(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody DiaryDTO.UpdateRequest request) {
        try {
            Long userId = authService.getCurrentUser(userDetails.getUsername()).getId();
            DiaryDTO.DiaryResponse response = diaryService.updateDiary(userId, id, request);
            return ApiResponse.success(response);
        } catch (Exception e) {
            return ApiResponse.error("更新日记失败", e.getMessage());
        }
    }

    @Operation(summary = "删除日记")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteDiary(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        try {
            Long userId = authService.getCurrentUser(userDetails.getUsername()).getId();
            diaryService.deleteDiary(userId, id);
            return ApiResponse.success("日记已删除", null);
        } catch (Exception e) {
            return ApiResponse.error("删除日记失败", e.getMessage());
        }
    }
}
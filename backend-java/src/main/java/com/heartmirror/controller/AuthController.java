package com.heartmirror.controller;

import com.heartmirror.dto.ApiResponse;
import com.heartmirror.dto.AuthDTO;
import com.heartmirror.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * 认证控制器
 */
@Tag(name = "认证", description = "用户登录、注册、游客登录等认证接口")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "用户登录")
    @PostMapping("/login")
    public ApiResponse<AuthDTO.LoginResponse> login(@Valid @RequestBody AuthDTO.LoginRequest request) {
        try {
            AuthDTO.LoginResponse response = authService.login(request);
            return ApiResponse.success(response);
        } catch (Exception e) {
            return ApiResponse.error("登录失败", e.getMessage());
        }
    }

    @Operation(summary = "用户注册")
    @PostMapping("/register")
    public ApiResponse<AuthDTO.LoginResponse> register(@Valid @RequestBody AuthDTO.RegisterRequest request) {
        try {
            AuthDTO.LoginResponse response = authService.register(request);
            return ApiResponse.success("注册成功", response);
        } catch (Exception e) {
            return ApiResponse.error("注册失败", e.getMessage());
        }
    }

    @Operation(summary = "游客登录")
    @PostMapping("/guest")
    public ApiResponse<AuthDTO.LoginResponse> guestLogin() {
        try {
            AuthDTO.LoginResponse response = authService.guestLogin();
            return ApiResponse.success(response);
        } catch (Exception e) {
            return ApiResponse.error("游客登录失败", e.getMessage());
        }
    }

    @Operation(summary = "获取当前用户信息")
    @GetMapping("/me")
    public ApiResponse<AuthDTO.UserDTO> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            AuthDTO.UserDTO user = authService.getCurrentUser(userDetails.getUsername());
            return ApiResponse.success(user);
        } catch (Exception e) {
            return ApiResponse.error("获取用户信息失败", e.getMessage());
        }
    }
}
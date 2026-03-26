package com.heartmirror.controller;

import com.heartmirror.dto.ApiResponse;
import com.heartmirror.dto.ChatDTO;
import com.heartmirror.entity.ChatSession;
import com.heartmirror.service.AuthService;
import com.heartmirror.service.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

/**
 * 聊天控制器
 */
@Tag(name = "对话", description = "AI聊天对话接口")
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final AuthService authService;

    @Operation(summary = "发送消息")
    @PostMapping("/send")
    public ApiResponse<ChatDTO.ChatResponse> sendMessage(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChatDTO.SendMessageRequest request) {
        try {
            Long userId = authService.getCurrentUser(userDetails.getUsername()).getId();
            ChatDTO.ChatResponse response = chatService.sendMessage(userId, request);
            return ApiResponse.success(response);
        } catch (IOException e) {
            return ApiResponse.error("AI服务暂时不可用", e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("发送消息失败", e.getMessage());
        }
    }

    @Operation(summary = "创建新会话")
    @PostMapping("/session")
    public ApiResponse<ChatDTO.SessionDTO> createSession(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            Long userId = authService.getCurrentUser(userDetails.getUsername()).getId();
            ChatSession session = chatService.createNewSession(userId);
            return ApiResponse.success(ChatDTO.SessionDTO.builder()
                    .id(session.getId())
                    .title(session.getTitle())
                    .riskLevel(session.getRiskLevel())
                    .messageCount(0)
                    .build());
        } catch (Exception e) {
            return ApiResponse.error("创建会话失败", e.getMessage());
        }
    }

    @Operation(summary = "获取会话列表")
    @GetMapping("/sessions")
    public ApiResponse<List<ChatDTO.SessionDTO>> getSessions(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            Long userId = authService.getCurrentUser(userDetails.getUsername()).getId();
            List<ChatDTO.SessionDTO> sessions = chatService.getUserSessions(userId);
            return ApiResponse.success(sessions);
        } catch (Exception e) {
            return ApiResponse.error("获取会话列表失败", e.getMessage());
        }
    }

    @Operation(summary = "获取会话消息")
    @GetMapping("/session/{sessionId}/messages")
    public ApiResponse<List<ChatDTO.MessageDTO>> getSessionMessages(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long sessionId) {
        try {
            Long userId = authService.getCurrentUser(userDetails.getUsername()).getId();
            List<ChatDTO.MessageDTO> messages = chatService.getSessionMessages(sessionId, userId);
            return ApiResponse.success(messages);
        } catch (Exception e) {
            return ApiResponse.error("获取消息失败", e.getMessage());
        }
    }

    @Operation(summary = "删除会话")
    @DeleteMapping("/session/{sessionId}")
    public ApiResponse<Void> deleteSession(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long sessionId) {
        try {
            Long userId = authService.getCurrentUser(userDetails.getUsername()).getId();
            chatService.deleteSession(sessionId, userId);
            return ApiResponse.success("会话已删除", null);
        } catch (Exception e) {
            return ApiResponse.error("删除会话失败", e.getMessage());
        }
    }
}
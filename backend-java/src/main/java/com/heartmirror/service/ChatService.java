package com.heartmirror.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.heartmirror.dto.ChatDTO;
import com.heartmirror.dto.EmotionDTO;
import com.heartmirror.entity.ChatMessage;
import com.heartmirror.entity.ChatSession;
import com.heartmirror.repository.ChatMessageRepository;
import com.heartmirror.repository.ChatSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 聊天服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatSessionRepository sessionRepository;
    private final ChatMessageRepository messageRepository;
    private final LlmService llmService;
    private final EmotionService emotionService;
    private final ObjectMapper objectMapper;

    /**
     * 发送消息并获取AI响应
     */
    @Transactional
    public ChatDTO.ChatResponse sendMessage(Long userId, ChatDTO.SendMessageRequest request) throws IOException {
        // 获取或创建会话
        ChatSession session;
        if (request.getSessionId() != null) {
            session = sessionRepository.findByIdAndUserId(request.getSessionId(), userId)
                    .orElseThrow(() -> new RuntimeException("会话不存在"));
        } else {
            session = createNewSession(userId);
        }

        // 分析用户消息情绪
        Map<String, Object> emotionResult = llmService.analyzeEmotion(userId, request.getContent());
        String primaryEmotion = (String) emotionResult.get("primary_emotion");
        Double intensity = (Double) emotionResult.get("intensity");
        String riskLevel = determineRiskLevel(primaryEmotion, intensity);

        // 保存用户消息
        ChatMessage userMessage = ChatMessage.builder()
                .sessionId(session.getId())
                .role(ChatMessage.Role.USER)
                .content(request.getContent())
                .emotion(primaryEmotion)
                .emotionIntensity(intensity)
                .riskLevel(riskLevel)
                .build();
        messageRepository.save(userMessage);

        // 更新会话风险等级
        if ("orange".equals(riskLevel) || "red".equals(riskLevel)) {
            session.setRiskLevel(riskLevel);
        }

        // 获取对话历史
        String history = buildConversationHistory(session.getId());

        // 生成AI响应
        String aiResponse = llmService.generateChatResponse(
                userId,
                request.getContent(),
                history,
                primaryEmotion,
                riskLevel
        );

        // 保存AI响应
        ChatMessage assistantMessage = ChatMessage.builder()
                .sessionId(session.getId())
                .role(ChatMessage.Role.ASSISTANT)
                .content(aiResponse)
                .emotion(primaryEmotion)
                .emotionIntensity(intensity)
                .riskLevel(riskLevel)
                .build();
        messageRepository.save(assistantMessage);

        // 更新会话
        session.setMessageCount(session.getMessageCount() + 2);
        session.setEmotionSummary(primaryEmotion);
        sessionRepository.save(session);

        return ChatDTO.ChatResponse.builder()
                .sessionId(session.getId())
                .content(aiResponse)
                .emotion(primaryEmotion)
                .emotionIntensity(intensity)
                .riskLevel(riskLevel)
                .build();
    }

    /**
     * 创建新会话
     */
    @Transactional
    public ChatSession createNewSession(Long userId) {
        ChatSession session = ChatSession.builder()
                .userId(userId)
                .title("新对话")
                .status(ChatSession.Status.ACTIVE)
                .riskLevel("green")
                .messageCount(0)
                .build();
        return sessionRepository.save(session);
    }

    /**
     * 获取用户的所有会话
     */
    public List<ChatDTO.SessionDTO> getUserSessions(Long userId) {
        List<ChatSession> sessions = sessionRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return sessions.stream()
                .map(this::toSessionDTO)
                .collect(Collectors.toList());
    }

    /**
     * 获取会话的消息列表
     */
    public List<ChatDTO.MessageDTO> getSessionMessages(Long sessionId, Long userId) {
        // 验证会话所有权
        sessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new RuntimeException("会话不存在"));

        List<ChatMessage> messages = messageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
        return messages.stream()
                .map(this::toMessageDTO)
                .collect(Collectors.toList());
    }

    /**
     * 删除会话
     */
    @Transactional
    public void deleteSession(Long sessionId, Long userId) {
        ChatSession session = sessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new RuntimeException("会话不存在"));

        // 删除消息
        List<ChatMessage> messages = messageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
        messageRepository.deleteAll(messages);

        // 删除会话
        sessionRepository.delete(session);
    }

    private String determineRiskLevel(String emotion, Double intensity) {
        if (intensity == null) return "green";

        // 高风险情绪
        if ("fear".equals(emotion) || "anger".equals(emotion)) {
            if (intensity > 0.8) return "red";
            if (intensity > 0.6) return "orange";
        }

        // 中等风险情绪
        if ("sadness".equals(emotion) || "anxiety".equals(emotion) || "frustration".equals(emotion)) {
            if (intensity > 0.7) return "orange";
            if (intensity > 0.5) return "yellow";
        }

        return "green";
    }

    private String buildConversationHistory(Long sessionId) {
        List<ChatMessage> messages = messageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
        StringBuilder history = new StringBuilder();
        for (ChatMessage msg : messages) {
            history.append(msg.getRole().name().toLowerCase()).append(": ")
                    .append(msg.getContent()).append("\n");
        }
        return history.toString();
    }

    private ChatDTO.SessionDTO toSessionDTO(ChatSession session) {
        return ChatDTO.SessionDTO.builder()
                .id(session.getId())
                .title(session.getTitle())
                .emotionSummary(session.getEmotionSummary())
                .riskLevel(session.getRiskLevel())
                .messageCount(session.getMessageCount())
                .createdAt(session.getCreatedAt() != null ? session.getCreatedAt().toString() : null)
                .updatedAt(session.getUpdatedAt() != null ? session.getUpdatedAt().toString() : null)
                .build();
    }

    private ChatDTO.MessageDTO toMessageDTO(ChatMessage message) {
        return ChatDTO.MessageDTO.builder()
                .id(message.getId())
                .role(message.getRole().name().toLowerCase())
                .content(message.getContent())
                .emotion(message.getEmotion())
                .emotionIntensity(message.getEmotionIntensity())
                .createdAt(message.getCreatedAt() != null ? message.getCreatedAt().toString() : null)
                .build();
    }
}
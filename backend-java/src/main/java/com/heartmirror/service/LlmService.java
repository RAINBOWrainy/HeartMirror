package com.heartmirror.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.heartmirror.dto.AISettingDTO;
import com.heartmirror.entity.AISetting;
import com.heartmirror.entity.User;
import com.heartmirror.repository.AISettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import okhttp3.sse.EventSource;
import okhttp3.sse.EventSourceListener;
import okhttp3.sse.EventSources;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

/**
 * LLM服务
 * 调用OpenAI兼容API
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LlmService {

    private final AISettingRepository aiSettingRepository;
    private final ObjectMapper objectMapper;

    @Value("${ai.default.model:gpt-3.5-turbo}")
    private String defaultModel;

    @Value("${ai.timeout.connect:30}")
    private int connectTimeout;

    @Value("${ai.timeout.read:120}")
    private int readTimeout;

    private final OkHttpClient httpClient = new OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(120, TimeUnit.SECONDS)
            .writeTimeout(60, TimeUnit.SECONDS)
            .build();

    /**
     * 获取用户的AI配置
     */
    public AISetting getUserAISetting(Long userId) {
        return aiSettingRepository.findByUserId(userId).orElse(null);
    }

    /**
     * 保存用户的AI配置
     */
    @Transactional
    public AISetting saveAISetting(Long userId, AISettingDTO.UpdateRequest request) {
        AISetting setting = aiSettingRepository.findByUserId(userId)
                .orElse(AISetting.builder().userId(userId).build());

        if (request.getApiKey() != null) {
            setting.setApiKey(request.getApiKey());
        }
        if (request.getBaseUrl() != null) {
            setting.setBaseUrl(request.getBaseUrl());
        }
        if (request.getModel() != null) {
            setting.setModel(request.getModel());
        }
        if (request.getTemperature() != null) {
            setting.setTemperature(request.getTemperature());
        }
        if (request.getMaxTokens() != null) {
            setting.setMaxTokens(request.getMaxTokens());
        }

        return aiSettingRepository.save(setting);
    }

    /**
     * 生成文本响应
     */
    public String generate(Long userId, String prompt, String systemPrompt) throws IOException {
        AISetting setting = getUserAISetting(userId);

        String apiKey = setting != null && setting.getApiKey() != null ?
                setting.getApiKey() : System.getenv("OPENAI_API_KEY");
        String baseUrl = setting != null && setting.getBaseUrl() != null ?
                setting.getBaseUrl() : "https://api.openai.com/v1";
        String model = setting != null && setting.getModel() != null ?
                setting.getModel() : defaultModel;
        Double temperature = setting != null ? setting.getTemperature() : 0.7;
        Integer maxTokens = setting != null ? setting.getMaxTokens() : 2000;

        return callOpenAI(apiKey, baseUrl, model, prompt, systemPrompt, temperature, maxTokens);
    }

    /**
     * 测试AI连接
     */
    public AISettingDTO.TestResponse testConnection(AISettingDTO.TestRequest request) {
        try {
            long startTime = System.currentTimeMillis();
            String response = callOpenAI(
                    request.getApiKey(),
                    request.getBaseUrl(),
                    request.getModel(),
                    "你好",
                    "请简单回复",
                    0.7,
                    20
            );
            long endTime = System.currentTimeMillis();

            return AISettingDTO.TestResponse.builder()
                    .connected(true)
                    .model(request.getModel())
                    .responseTime((double) (endTime - startTime) / 1000)
                    .response(response.length() > 100 ? response.substring(0, 100) : response)
                    .build();
        } catch (Exception e) {
            log.error("AI连接测试失败", e);
            return AISettingDTO.TestResponse.builder()
                    .connected(false)
                    .model(request.getModel())
                    .error(e.getMessage())
                    .build();
        }
    }

    /**
     * 调用OpenAI兼容API
     */
    private String callOpenAI(String apiKey, String baseUrl, String model,
                               String prompt, String systemPrompt,
                               Double temperature, Integer maxTokens) throws IOException {
        // 构建请求体
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model);
        requestBody.put("temperature", temperature);
        requestBody.put("max_tokens", maxTokens);

        // 构建消息
        Map<String, String> systemMessage = new HashMap<>();
        systemMessage.put("role", "system");
        systemMessage.put("content", systemPrompt != null ? systemPrompt : "你是一个有帮助的AI助手。");

        Map<String, String> userMessage = new HashMap<>();
        userMessage.put("role", "user");
        userMessage.put("content", prompt);

        requestBody.put("messages", new Object[]{systemMessage, userMessage});

        String jsonBody = objectMapper.writeValueAsString(requestBody);

        Request request = new Request.Builder()
                .url(baseUrl + "/chat/completions")
                .addHeader("Authorization", "Bearer " + apiKey)
                .addHeader("Content-Type", "application/json")
                .post(RequestBody.create(jsonBody, MediaType.parse("application/json")))
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("API调用失败: " + response.code() + " " + response.message());
            }

            String responseBody = response.body().string();
            JsonNode root = objectMapper.readTree(responseBody);
            return root.path("choices").get(0).path("message").path("content").asText();
        }
    }

    /**
     * 分析情绪
     */
    public Map<String, Object> analyzeEmotion(Long userId, String text) throws IOException {
        String systemPrompt = """
                你是一位善于共情的情绪分析专家。请从用户的话语中理解他们真实的情绪状态。

                分析要点：
                1. 用户字面表达的情绪
                2. 用户隐含的情绪
                3. 情绪的强度和紧迫程度

                请以JSON格式返回结果，包含以下字段：
                - primary_emotion: 主要情绪
                - intensity: 情绪强度（0-1）
                - confidence: 分析置信度（0-1）
                - secondary_emotions: 次要情绪列表
                - reasoning: 简短的分析理由
                - suggested_tone: 建议的回应语调
                """;

        String result = generate(userId,
                "请分析以下用户表达的情绪：\n\n用户说：\"" + text + "\"",
                systemPrompt);

        // 解析JSON
        try {
            return objectMapper.readValue(result, Map.class);
        } catch (Exception e) {
            // 返回默认情绪分析
            Map<String, Object> defaultResult = new HashMap<>();
            defaultResult.put("primary_emotion", "neutral");
            defaultResult.put("intensity", 0.5);
            defaultResult.put("confidence", 0.3);
            defaultResult.put("secondary_emotions", new String[]{});
            defaultResult.put("reasoning", "降级分析");
            defaultResult.put("suggested_tone", "温暖");
            return defaultResult;
        }
    }

    /**
     * 生成聊天响应
     */
    public String generateChatResponse(Long userId, String userMessage,
                                        String conversationHistory,
                                        String emotionDetected,
                                        String riskLevel) throws IOException {
        String systemPrompt = """
                你是HeartMirror心理健康助手，一个温暖、专业的AI助手。
                你的职责是：
                1. 倾听用户的情绪和烦恼
                2. 提供情感支持和理解
                3. 引导用户进行自我探索
                4. 在必要时提供专业资源建议

                注意：
                - 不做医疗诊断
                - 发现高风险信号时提醒用户寻求专业帮助
                - 保持同理心和专业态度
                - 回复简洁温暖，不要过长
                """;

        String prompt = String.format(
                "[检测到的情绪: %s, 风险等级: %s]\n%s\n用户说：%s",
                emotionDetected != null ? emotionDetected : "未知",
                riskLevel != null ? riskLevel : "green",
                conversationHistory != null ? conversationHistory : "",
                userMessage
        );

        return generate(userId, prompt, systemPrompt);
    }
}
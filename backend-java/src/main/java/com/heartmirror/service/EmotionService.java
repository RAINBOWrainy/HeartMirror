package com.heartmirror.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.heartmirror.dto.EmotionDTO;
import com.heartmirror.entity.EmotionRecord;
import com.heartmirror.repository.EmotionRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 情绪服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmotionService {

    private final EmotionRecordRepository emotionRecordRepository;
    private final LlmService llmService;
    private final ObjectMapper objectMapper;

    /**
     * 分析并记录情绪
     */
    @Transactional
    public EmotionDTO.EmotionResult analyzeAndRecord(Long userId, String text, String source, Long sessionId) {
        try {
            // 使用LLM分析情绪
            Map<String, Object> result = llmService.analyzeEmotion(userId, text);

            String primaryEmotion = (String) result.get("primary_emotion");
            Double intensity = ((Number) result.get("intensity")).doubleValue();
            Double confidence = ((Number) result.get("confidence")).doubleValue();
            String reasoning = (String) result.get("reasoning");
            String suggestedTone = (String) result.get("suggested_tone");

            @SuppressWarnings("unchecked")
            List<String> secondaryEmotions = (List<String>) result.get("secondary_emotions");

            // 确定风险等级
            String riskLevel = determineRiskLevel(primaryEmotion, intensity);

            // 保存情绪记录
            EmotionRecord record = EmotionRecord.builder()
                    .userId(userId)
                    .primaryEmotion(primaryEmotion)
                    .intensity(intensity)
                    .confidence(confidence)
                    .secondaryEmotions(secondaryEmotions != null ? objectMapper.writeValueAsString(secondaryEmotions) : "[]")
                    .source(source)
                    .context(text)
                    .suggestedTone(suggestedTone)
                    .riskLevel(riskLevel)
                    .sessionId(sessionId)
                    .build();

            emotionRecordRepository.save(record);

            return EmotionDTO.EmotionResult.builder()
                    .primaryEmotion(primaryEmotion)
                    .intensity(intensity)
                    .confidence(confidence)
                    .secondaryEmotions(secondaryEmotions)
                    .reasoning(reasoning)
                    .suggestedTone(suggestedTone)
                    .build();

        } catch (Exception e) {
            log.error("情绪分析失败", e);
            // 返回默认情绪
            return EmotionDTO.EmotionResult.builder()
                    .primaryEmotion("neutral")
                    .intensity(0.5)
                    .confidence(0.3)
                    .secondaryEmotions(Collections.emptyList())
                    .reasoning("分析失败，返回默认情绪")
                    .suggestedTone("温暖")
                    .build();
        }
    }

    /**
     * 获取用户的情绪记录
     */
    public List<EmotionDTO.EmotionRecordDTO> getUserEmotionRecords(Long userId) {
        List<EmotionRecord> records = emotionRecordRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return records.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * 获取用户情绪统计
     */
    public EmotionDTO.EmotionStats getEmotionStats(Long userId) {
        long totalRecords = emotionRecordRepository.count();
        Double avgIntensity = emotionRecordRepository.getAverageIntensity(userId);

        List<Object[]> emotionCounts = emotionRecordRepository.countByPrimaryEmotion(userId);
        List<EmotionDTO.EmotionCount> counts = emotionCounts.stream()
                .map(arr -> EmotionDTO.EmotionCount.builder()
                        .emotion((String) arr[0])
                        .count((Long) arr[1])
                        .build())
                .collect(Collectors.toList());

        return EmotionDTO.EmotionStats.builder()
                .totalRecords(totalRecords)
                .averageIntensity(avgIntensity != null ? avgIntensity : 0.0)
                .emotionCounts(counts)
                .build();
    }

    /**
     * 快速情绪识别（基于关键词）
     */
    public EmotionDTO.EmotionResult quickAnalyze(String text) {
        // 情绪关键词映射
        Map<String, String> emotionKeywords = new HashMap<>();
        emotionKeywords.put("开心", "joy");
        emotionKeywords.put("高兴", "joy");
        emotionKeywords.put("快乐", "joy");
        emotionKeywords.put("幸福", "joy");
        emotionKeywords.put("难过", "sadness");
        emotionKeywords.put("伤心", "sadness");
        emotionKeywords.put("悲伤", "sadness");
        emotionKeywords.put("焦虑", "anxiety");
        emotionKeywords.put("紧张", "anxiety");
        emotionKeywords.put("担心", "anxiety");
        emotionKeywords.put("生气", "anger");
        emotionKeywords.put("愤怒", "anger");
        emotionKeywords.put("烦躁", "frustration");
        emotionKeywords.put("累", "frustration");
        emotionKeywords.put("疲惫", "frustration");
        emotionKeywords.put("害怕", "fear");
        emotionKeywords.put("恐惧", "fear");
        emotionKeywords.put("孤独", "loneliness");
        emotionKeywords.put("寂寞", "loneliness");
        emotionKeywords.put("平静", "calm");
        emotionKeywords.put("放松", "calm");

        String detectedEmotion = "neutral";
        double intensity = 0.3;

        for (Map.Entry<String, String> entry : emotionKeywords.entrySet()) {
            if (text.contains(entry.getKey())) {
                detectedEmotion = entry.getValue();
                intensity = 0.5;
                break;
            }
        }

        return EmotionDTO.EmotionResult.builder()
                .primaryEmotion(detectedEmotion)
                .intensity(intensity)
                .confidence(0.4)
                .secondaryEmotions(Collections.emptyList())
                .reasoning("基于关键词快速检测")
                .suggestedTone("温暖")
                .build();
    }

    private String determineRiskLevel(String emotion, Double intensity) {
        if (intensity == null) return "green";

        if ("fear".equals(emotion) || "anger".equals(emotion)) {
            if (intensity > 0.8) return "red";
            if (intensity > 0.6) return "orange";
        }

        if ("sadness".equals(emotion) || "anxiety".equals(emotion) || "frustration".equals(emotion)) {
            if (intensity > 0.7) return "orange";
            if (intensity > 0.5) return "yellow";
        }

        return "green";
    }

    private EmotionDTO.EmotionRecordDTO toDTO(EmotionRecord record) {
        List<String> secondaryEmotions = Collections.emptyList();
        try {
            secondaryEmotions = objectMapper.readValue(
                    record.getSecondaryEmotions(),
                    new TypeReference<List<String>>() {}
            );
        } catch (Exception e) {
            log.warn("解析次要情绪失败", e);
        }

        return EmotionDTO.EmotionRecordDTO.builder()
                .id(record.getId())
                .primaryEmotion(record.getPrimaryEmotion())
                .intensity(record.getIntensity())
                .confidence(record.getConfidence())
                .secondaryEmotions(record.getSecondaryEmotions())
                .source(record.getSource())
                .context(record.getContext())
                .riskLevel(record.getRiskLevel())
                .createdAt(record.getCreatedAt() != null ? record.getCreatedAt().toString() : null)
                .build();
    }
}
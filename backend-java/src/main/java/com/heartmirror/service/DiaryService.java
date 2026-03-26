package com.heartmirror.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.heartmirror.dto.DiaryDTO;
import com.heartmirror.entity.Diary;
import com.heartmirror.repository.DiaryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 日记服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DiaryService {

    private final DiaryRepository diaryRepository;
    private final LlmService llmService;
    private final ObjectMapper objectMapper;

    /**
     * 创建日记
     */
    @Transactional
    public DiaryDTO.DiaryResponse createDiary(Long userId, DiaryDTO.CreateRequest request) {
        // 从内容生成标题
        String title = generateTitle(request.getContent());

        // 分析情绪
        Map<String, Object> emotionAnalysis = null;
        try {
            emotionAnalysis = llmService.analyzeEmotion(userId, request.getContent());
        } catch (Exception e) {
            log.warn("情绪分析失败，使用默认值: {}", e.getMessage());
            emotionAnalysis = new HashMap<>();
            emotionAnalysis.put("primary_emotion", "neutral");
            emotionAnalysis.put("intensity", 0.5);
        }

        String emotionJson = null;
        try {
            emotionJson = objectMapper.writeValueAsString(emotionAnalysis);
        } catch (JsonProcessingException e) {
            log.error("序列化情绪分析结果失败", e);
        }

        // 计算心情分数
        Integer moodScore = calculateMoodScore(request.getMood(), emotionAnalysis);

        Diary diary = Diary.builder()
                .userId(userId)
                .date(LocalDate.now())
                .title(title)
                .content(request.getContent())
                .mood(request.getMood())
                .moodScore(moodScore)
                .emotionAnalysis(emotionJson)
                .build();

        Diary saved = diaryRepository.save(diary);
        return toDiaryResponse(saved);
    }

    /**
     * 获取日记列表
     */
    public List<DiaryDTO.DiaryListResponse> getDiaryList(Long userId, int limit, int offset) {
        List<Diary> diaries = diaryRepository.findByUserIdOrderByDateDesc(userId);
        return diaries.stream()
                .skip(offset)
                .limit(limit > 0 ? limit : diaries.size())
                .map(this::toDiaryListResponse)
                .collect(Collectors.toList());
    }

    /**
     * 获取日记详情
     */
    public DiaryDTO.DiaryResponse getDiaryById(Long userId, Long diaryId) {
        Diary diary = diaryRepository.findByIdAndUserId(diaryId, userId)
                .orElseThrow(() -> new RuntimeException("日记不存在"));
        return toDiaryResponse(diary);
    }

    /**
     * 更新日记
     */
    @Transactional
    public DiaryDTO.DiaryResponse updateDiary(Long userId, Long diaryId, DiaryDTO.UpdateRequest request) {
        Diary diary = diaryRepository.findByIdAndUserId(diaryId, userId)
                .orElseThrow(() -> new RuntimeException("日记不存在"));

        if (request.getContent() != null) {
            diary.setContent(request.getContent());
            diary.setTitle(generateTitle(request.getContent()));

            // 重新分析情绪
            try {
                Map<String, Object> emotionAnalysis = llmService.analyzeEmotion(userId, request.getContent());
                diary.setEmotionAnalysis(objectMapper.writeValueAsString(emotionAnalysis));
            } catch (Exception e) {
                log.warn("更新情绪分析失败", e);
            }
        }
        if (request.getMood() != null) {
            diary.setMood(request.getMood());
        }

        Diary updated = diaryRepository.save(diary);
        return toDiaryResponse(updated);
    }

    /**
     * 删除日记
     */
    @Transactional
    public void deleteDiary(Long userId, Long diaryId) {
        Diary diary = diaryRepository.findByIdAndUserId(diaryId, userId)
                .orElseThrow(() -> new RuntimeException("日记不存在"));
        diaryRepository.delete(diary);
    }

    /**
     * 从内容生成标题
     */
    private String generateTitle(String content) {
        if (content == null || content.isEmpty()) {
            return "无题";
        }
        // 取前30个字符作为标题
        String title = content.replaceAll("\\s+", " ").trim();
        if (title.length() > 30) {
            return title.substring(0, 30) + "...";
        }
        return title;
    }

    /**
     * 计算心情分数
     */
    private Integer calculateMoodScore(String mood, Map<String, Object> emotionAnalysis) {
        // 基于心情类型的基础分数
        int baseScore = 5; // 默认中性
        if (mood != null) {
            switch (mood.toLowerCase()) {
                case "happy":
                case "开心":
                    baseScore = 8;
                    break;
                case "calm":
                case "平静":
                    baseScore = 7;
                    break;
                case "neutral":
                case "中性":
                    baseScore = 5;
                    break;
                case "sad":
                case "悲伤":
                    baseScore = 3;
                    break;
                case "anxious":
                case "焦虑":
                    baseScore = 3;
                    break;
                case "angry":
                case "愤怒":
                    baseScore = 2;
                    break;
                case "fear":
                case "恐惧":
                    baseScore = 2;
                    break;
            }
        }

        // 根据情绪强度调整
        if (emotionAnalysis != null && emotionAnalysis.get("intensity") != null) {
            double intensity = ((Number) emotionAnalysis.get("intensity")).doubleValue();
            // 根据情绪类型调整分数
            String primaryEmotion = (String) emotionAnalysis.get("primary_emotion");
            if (primaryEmotion != null) {
                if (primaryEmotion.contains("happy") || primaryEmotion.contains("joy")) {
                    baseScore = (int) (baseScore + intensity * 2);
                } else if (primaryEmotion.contains("sad") || primaryEmotion.contains("anxious") || primaryEmotion.contains("fear")) {
                    baseScore = (int) (baseScore - intensity * 2);
                }
            }
        }

        return Math.max(1, Math.min(10, baseScore));
    }

    private DiaryDTO.DiaryResponse toDiaryResponse(Diary diary) {
        List<String> tags = null;
        // 从情绪分析中提取标签
        if (diary.getEmotionAnalysis() != null) {
            try {
                Map<String, Object> analysis = objectMapper.readValue(diary.getEmotionAnalysis(), new TypeReference<>() {});
                if (analysis.get("secondary_emotions") != null) {
                    tags = objectMapper.convertValue(analysis.get("secondary_emotions"), new TypeReference<>() {});
                }
            } catch (Exception e) {
                log.warn("解析情绪分析失败", e);
            }
        }

        return DiaryDTO.DiaryResponse.builder()
                .id(diary.getId())
                .date(diary.getDate())
                .title(diary.getTitle())
                .content(diary.getContent())
                .mood(diary.getMood())
                .moodScore(diary.getMoodScore())
                .emotionAnalysis(diary.getEmotionAnalysis())
                .tags(tags)
                .createdAt(diary.getCreatedAt() != null ? diary.getCreatedAt().toString() : null)
                .updatedAt(diary.getUpdatedAt() != null ? diary.getUpdatedAt().toString() : null)
                .build();
    }

    private DiaryDTO.DiaryListResponse toDiaryListResponse(Diary diary) {
        return DiaryDTO.DiaryListResponse.builder()
                .id(diary.getId())
                .date(diary.getDate())
                .title(diary.getTitle())
                .mood(diary.getMood())
                .moodScore(diary.getMoodScore())
                .createdAt(diary.getCreatedAt() != null ? diary.getCreatedAt().toString() : null)
                .build();
    }
}
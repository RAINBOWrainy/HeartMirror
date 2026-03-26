package com.heartmirror.service;

import com.heartmirror.dto.DashboardDTO;
import com.heartmirror.entity.ChatSession;
import com.heartmirror.entity.Diary;
import com.heartmirror.entity.EmotionRecord;
import com.heartmirror.entity.InterventionSession;
import com.heartmirror.entity.QuestionnaireSession;
import com.heartmirror.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 数据看板服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ChatSessionRepository chatSessionRepository;
    private final DiaryRepository diaryRepository;
    private final EmotionRecordRepository emotionRecordRepository;
    private final InterventionSessionRepository interventionSessionRepository;
    private final QuestionnaireSessionRepository questionnaireSessionRepository;

    /**
     * 获取看板数据
     */
    public DashboardDTO.DashboardResponse getDashboard(Long userId, int days) {
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);

        // 获取概览数据
        DashboardDTO.Overview overview = getOverview(userId);

        // 获取情绪趋势
        List<DashboardDTO.EmotionTrendPoint> emotionTrend = getEmotionTrend(userId, days);

        // 获取情绪分布
        Map<String, Integer> emotionDistribution = getEmotionDistribution(userId, days);

        // 获取干预统计
        DashboardDTO.InterventionStats interventionStats = getInterventionStats(userId);

        // 获取问卷统计
        DashboardDTO.QuestionnaireStats questionnaireStats = getQuestionnaireStats(userId);

        // 获取最近活动
        List<DashboardDTO.Activity> recentActivities = getRecentActivities(userId, 10);

        return DashboardDTO.DashboardResponse.builder()
                .overview(overview)
                .emotionTrend(emotionTrend)
                .emotionDistribution(emotionDistribution)
                .interventionStats(interventionStats)
                .questionnaireStats(questionnaireStats)
                .recentActivities(recentActivities)
                .build();
    }

    /**
     * 获取概览数据
     */
    private DashboardDTO.Overview getOverview(Long userId) {
        Long totalSessions = chatSessionRepository.countByUserId(userId);
        Long totalDiaries = diaryRepository.findByUserIdOrderByDateDesc(userId).size();
        Long totalInterventions = interventionSessionRepository.countCompletedByUserId(userId);
        Integer currentStreak = calculateStreak(userId);

        // 获取最新风险评估等级
        String riskLevel = "green";
        Optional<QuestionnaireSession> latestSession =
                questionnaireSessionRepository.findLatestCompletedByType(userId, "phq9");
        if (latestSession.isPresent() && latestSession.get().getRiskLevel() != null) {
            riskLevel = latestSession.get().getRiskLevel().name().toLowerCase();
        }

        return DashboardDTO.Overview.builder()
                .totalSessions(totalSessions)
                .totalDiaries(totalDiaries)
                .totalInterventions(totalInterventions)
                .currentStreak(currentStreak)
                .riskLevel(riskLevel)
                .build();
    }

    /**
     * 计算连续打卡天数
     */
    private Integer calculateStreak(Long userId) {
        List<Diary> diaries = diaryRepository.findByUserIdOrderByDateDesc(userId);
        if (diaries.isEmpty()) {
            return 0;
        }

        int streak = 0;
        LocalDate today = LocalDate.now();
        LocalDate lastDate = diaries.get(0).getDate();

        // 检查今天或昨天是否有记录
        if (lastDate.equals(today) || lastDate.equals(today.minusDays(1))) {
            streak = 1;
            LocalDate expectedDate = lastDate.minusDays(1);

            for (int i = 1; i < diaries.size(); i++) {
                if (diaries.get(i).getDate().equals(expectedDate)) {
                    streak++;
                    expectedDate = expectedDate.minusDays(1);
                } else {
                    break;
                }
            }
        }

        return streak;
    }

    /**
     * 获取情绪趋势
     */
    private List<DashboardDTO.EmotionTrendPoint> getEmotionTrend(Long userId, int days) {
        List<EmotionRecord> records = emotionRecordRepository.findByUserId(userId);
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);

        // 按日期分组
        Map<LocalDate, List<EmotionRecord>> byDate = records.stream()
                .filter(r -> r.getCreatedAt() != null && r.getCreatedAt().isAfter(startDate))
                .collect(Collectors.groupingBy(r -> r.getCreatedAt().toLocalDate()));

        return byDate.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    List<EmotionRecord> dayRecords = entry.getValue();
                    double avgIntensity = dayRecords.stream()
                            .filter(r -> r.getIntensity() != null)
                            .mapToDouble(EmotionRecord::getIntensity)
                            .average()
                            .orElse(0.5);

                    // 找出最常见的情绪
                    String dominantEmotion = dayRecords.stream()
                            .filter(r -> r.getPrimaryEmotion() != null)
                            .collect(Collectors.groupingBy(EmotionRecord::getPrimaryEmotion, Collectors.counting()))
                            .entrySet().stream()
                            .max(Map.Entry.comparingByValue())
                            .map(Map.Entry::getKey)
                            .orElse("neutral");

                    return DashboardDTO.EmotionTrendPoint.builder()
                            .date(entry.getKey().toString())
                            .averageIntensity(avgIntensity)
                            .dominantEmotion(dominantEmotion)
                            .build();
                })
                .collect(Collectors.toList());
    }

    /**
     * 获取情绪分布
     */
    private Map<String, Integer> getEmotionDistribution(Long userId, int days) {
        List<EmotionRecord> records = emotionRecordRepository.findByUserId(userId);
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);

        return records.stream()
                .filter(r -> r.getCreatedAt() != null && r.getCreatedAt().isAfter(startDate))
                .filter(r -> r.getPrimaryEmotion() != null)
                .collect(Collectors.groupingBy(
                        EmotionRecord::getPrimaryEmotion,
                        Collectors.collectingAndThen(Collectors.counting(), Long::intValue)
                ));
    }

    /**
     * 获取干预统计
     */
    private DashboardDTO.InterventionStats getInterventionStats(Long userId) {
        Long total = interventionSessionRepository.countByUserId(userId);
        Long completed = interventionSessionRepository.countCompletedByUserId(userId);

        Map<String, Long> byType = new HashMap<>();
        // 简化：按干预类型统计需要更复杂的查询
        byType.put("breathing", 0L);
        byType.put("mindfulness", 0L);
        byType.put("cbt", 0L);

        return DashboardDTO.InterventionStats.builder()
                .total(total)
                .completed(completed)
                .completionRate(total > 0 ? (double) completed / total : 0.0)
                .byType(byType)
                .build();
    }

    /**
     * 获取问卷统计
     */
    private DashboardDTO.QuestionnaireStats getQuestionnaireStats(Long userId) {
        Long totalSessions = (long) questionnaireSessionRepository.findByUserIdOrderByStartedAtDesc(userId).size();
        Long completedSessions = questionnaireSessionRepository.countCompletedByUserId(userId);

        Integer latestPhq9Score = null;
        Integer latestGad7Score = null;

        Optional<QuestionnaireSession> latestPhq9 =
                questionnaireSessionRepository.findLatestCompletedByType(userId, "phq9");
        if (latestPhq9.isPresent()) {
            latestPhq9Score = latestPhq9.get().getTotalScore();
        }

        Optional<QuestionnaireSession> latestGad7 =
                questionnaireSessionRepository.findLatestCompletedByType(userId, "gad7");
        if (latestGad7.isPresent()) {
            latestGad7Score = latestGad7.get().getTotalScore();
        }

        Map<String, Long> byType = new HashMap<>();
        byType.put("phq9", 0L);
        byType.put("gad7", 0L);
        byType.put("dass21", 0L);

        return DashboardDTO.QuestionnaireStats.builder()
                .totalSessions(totalSessions)
                .completedSessions(completedSessions)
                .latestPhq9Score(latestPhq9Score)
                .latestGad7Score(latestGad7Score)
                .byType(byType)
                .build();
    }

    /**
     * 获取最近活动
     */
    private List<DashboardDTO.Activity> getRecentActivities(Long userId, int limit) {
        List<DashboardDTO.Activity> activities = new ArrayList<>();

        // 获取最近的聊天会话
        List<ChatSession> chatSessions = chatSessionRepository.findByUserIdOrderByCreatedAtDesc(userId);
        chatSessions.stream()
                .limit(3)
                .forEach(s -> activities.add(DashboardDTO.Activity.builder()
                        .type("chat")
                        .title("AI对话: " + (s.getTitle() != null ? s.getTitle() : "新对话"))
                        .timestamp(s.getCreatedAt() != null ? s.getCreatedAt().toString() : null)
                        .build()));

        // 获取最近的日记
        List<Diary> diaries = diaryRepository.findByUserIdOrderByDateDesc(userId);
        diaries.stream()
                .limit(3)
                .forEach(d -> activities.add(DashboardDTO.Activity.builder()
                        .type("diary")
                        .title("日记: " + (d.getTitle() != null ? d.getTitle() : "无题"))
                        .timestamp(d.getCreatedAt() != null ? d.getCreatedAt().toString() : null)
                        .intensity(d.getMoodScore() != null ? d.getMoodScore() / 10.0 : null)
                        .build()));

        // 获取最近的干预会话
        List<InterventionSession> interventions = interventionSessionRepository.findByUserIdOrderByStartedAtDesc(userId);
        interventions.stream()
                .filter(InterventionSession::getIsCompleted)
                .limit(3)
                .forEach(i -> activities.add(DashboardDTO.Activity.builder()
                        .type("intervention")
                        .title("完成干预练习")
                        .timestamp(i.getCompletedAt() != null ? i.getCompletedAt().toString() : null)
                        .intensity(i.getUserRating() != null ? i.getUserRating() / 5.0 : null)
                        .build()));

        // 按时间排序并限制数量
        return activities.stream()
                .filter(a -> a.getTimestamp() != null)
                .sorted((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()))
                .limit(limit)
                .collect(Collectors.toList());
    }
}
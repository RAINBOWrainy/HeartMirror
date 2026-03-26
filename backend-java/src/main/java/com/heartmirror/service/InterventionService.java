package com.heartmirror.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.heartmirror.dto.InterventionDTO;
import com.heartmirror.entity.Intervention;
import com.heartmirror.entity.InterventionSession;
import com.heartmirror.repository.InterventionRepository;
import com.heartmirror.repository.InterventionSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 干预计划服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InterventionService {

    private final InterventionRepository interventionRepository;
    private final InterventionSessionRepository sessionRepository;
    private final ObjectMapper objectMapper;

    // 默认干预计划模板
    private static final List<Map<String, Object>> DEFAULT_PLANS = List.of(
            Map.of(
                    "title", "深呼吸放松练习",
                    "description", "通过控制呼吸来缓解紧张和焦虑，适合日常放松使用",
                    "interventionType", "breathing",
                    "targetEmotions", List.of("anxiety", "fear", "anger"),
                    "steps", List.of(
                            "找一个安静的地方坐下或躺下",
                            "一只手放在胸口，另一只手放在腹部",
                            "通过鼻子慢慢吸气4秒",
                            "屏住呼吸4秒",
                            "通过嘴巴慢慢呼气6秒",
                            "重复5-10次"
                    ),
                    "durationMinutes", 5,
                    "difficultyLevel", 1
            ),
            Map.of(
                    "title", "正念冥想入门",
                    "description", "通过正念冥想来培养当下的觉察力，减少负面情绪",
                    "interventionType", "mindfulness",
                    "targetEmotions", List.of("sadness", "anxiety", "anger"),
                    "steps", List.of(
                            "找一个安静的地方坐下",
                            "闭上眼睛，专注于你的呼吸",
                            "当思绪飘走时，温和地将注意力带回呼吸",
                            "不要评判任何出现的想法",
                            "持续10-15分钟",
                            "慢慢睁开眼睛，感受当下的状态"
                    ),
                    "durationMinutes", 15,
                    "difficultyLevel", 2
            ),
            Map.of(
                    "title", "认知重构练习",
                    "description", "CBT认知行为疗法技术，帮助识别和改变消极思维模式",
                    "interventionType", "cbt",
                    "targetEmotions", List.of("sadness", "anxiety", "anger"),
                    "steps", List.of(
                            "写下让你困扰的想法",
                            "问自己：这个想法是事实还是观点？",
                            "寻找支持这个想法的证据",
                            "寻找反对这个想法的证据",
                            "尝试用一个更平衡的想法来替代",
                            "记录你的感受变化"
                    ),
                    "durationMinutes", 20,
                    "difficultyLevel", 3
            ),
            Map.of(
                    "title", "渐进式肌肉放松",
                    "description", "通过依次紧张和放松肌肉群来释放身体紧张",
                    "interventionType", "relaxation",
                    "targetEmotions", List.of("anxiety", "fear", "anger"),
                    "steps", List.of(
                            "找一个舒适的位置躺下",
                            "从脚趾开始，紧绷肌肉5秒",
                            "然后放松，感受紧张和放松的区别",
                            "逐渐向上移动：小腿、大腿、臀部、腹部、胸部、手臂、肩膀、脸部",
                            "最后全身放松，享受放松的状态"
                    ),
                    "durationMinutes", 20,
                    "difficultyLevel", 2
            ),
            Map.of(
                    "title", "感恩日记",
                    "description", "通过记录感恩的事物来培养积极情绪",
                    "interventionType", "positive_psychology",
                    "targetEmotions", List.of("sadness", "anxiety"),
                    "steps", List.of(
                            "准备一个笔记本或使用手机记录",
                            "写下今天发生的3件让你感恩的事",
                            "可以是小事，比如阳光很好、朋友的消息",
                            "详细描述为什么感恩这些事",
                            "感受写下时的情绪变化"
                    ),
                    "durationMinutes", 10,
                    "difficultyLevel", 1
            ),
            Map.of(
                    "title", "身体锻炼",
                    "description", "通过运动释放压力，改善情绪",
                    "interventionType", "exercise",
                    "targetEmotions", List.of("sadness", "anxiety", "anger"),
                    "steps", List.of(
                            "选择你喜欢的运动方式：散步、跑步、瑜伽等",
                            "开始前做5分钟热身",
                            "保持中等强度运动20-30分钟",
                            "运动后做5分钟拉伸",
                            "记录运动后的感受变化"
                    ),
                    "durationMinutes", 30,
                    "difficultyLevel", 2
            ),
            Map.of(
                    "title", "社交连接练习",
                    "description", "通过与他人的积极互动来提升情绪",
                    "interventionType", "social",
                    "targetEmotions", List.of("sadness", "loneliness"),
                    "steps", List.of(
                            "想一个你想联系的朋友或家人",
                            "给他们发一条消息或打个电话",
                            "分享一件最近发生的事",
                            "询问他们最近怎么样",
                            "享受这种连接的感觉"
                    ),
                    "durationMinutes", 15,
                    "difficultyLevel", 1
            ),
            Map.of(
                    "title", "情绪表达书写",
                    "description", "通过书写来表达和处理情绪",
                    "interventionType", "journaling",
                    "targetEmotions", List.of("sadness", "anxiety", "anger", "fear"),
                    "steps", List.of(
                            "找一个安静的地方，准备纸笔",
                            "花15-20分钟写下你现在的感受",
                            "不要担心语法或结构",
                            "让思绪自由流动",
                            "写完后可以选择保存或销毁"
                    ),
                    "durationMinutes", 20,
                    "difficultyLevel", 1
            )
    );

    /**
     * 获取干预计划列表
     */
    public List<InterventionDTO.PlanResponse> getPlans(Long userId, boolean activeOnly, int limit) {
        // 如果用户没有计划，初始化默认计划
        List<Intervention> plans = interventionRepository.findByUserIdOrderByCreatedAtDesc(userId);
        if (plans.isEmpty()) {
            plans = initializeDefaultPlans(userId);
        }

        if (activeOnly) {
            plans = plans.stream()
                    .filter(p -> p.getStatus() == Intervention.Status.ACTIVE)
                    .collect(Collectors.toList());
        }

        return plans.stream()
                .limit(limit > 0 ? limit : plans.size())
                .map(this::toPlanResponse)
                .collect(Collectors.toList());
    }

    /**
     * 获取单个计划
     */
    public InterventionDTO.PlanResponse getPlanById(Long userId, Long planId) {
        Intervention plan = interventionRepository.findByIdAndUserId(planId, userId)
                .orElseThrow(() -> new RuntimeException("干预计划不存在"));
        return toPlanResponse(plan);
    }

    /**
     * 开始干预会话
     */
    @Transactional
    public InterventionDTO.SessionResponse startSession(Long userId, Long planId, InterventionDTO.StartSessionRequest request) {
        Intervention plan = interventionRepository.findByIdAndUserId(planId, userId)
                .orElseThrow(() -> new RuntimeException("干预计划不存在"));

        InterventionSession session = InterventionSession.builder()
                .userId(userId)
                .planId(planId)
                .emotionBefore(request != null ? request.getEmotionBefore() : null)
                .intensityBefore(request != null ? request.getIntensityBefore() : null)
                .isCompleted(false)
                .build();

        InterventionSession saved = sessionRepository.save(session);
        return toSessionResponse(saved);
    }

    /**
     * 完成干预会话
     */
    @Transactional
    public InterventionDTO.SessionResponse completeSession(Long userId, Long sessionId, InterventionDTO.CompleteSessionRequest request) {
        InterventionSession session = sessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new RuntimeException("会话不存在"));

        if (session.getIsCompleted()) {
            throw new RuntimeException("会话已完成");
        }

        session.setIsCompleted(true);
        session.setCompletedAt(LocalDateTime.now());

        if (request != null) {
            session.setUserRating(request.getUserRating());
            session.setEmotionAfter(request.getEmotionAfter());
            session.setIntensityAfter(request.getIntensityAfter());
            session.setActualDuration(request.getActualDuration());
            session.setFeedback(request.getFeedback());
        }

        // 更新计划的完成次数
        interventionRepository.findById(session.getPlanId()).ifPresent(plan -> {
            plan.setCompletionCount(plan.getCompletionCount() + 1);
            interventionRepository.save(plan);
        });

        InterventionSession saved = sessionRepository.save(session);
        return toSessionResponse(saved);
    }

    /**
     * 获取推荐
     */
    public List<InterventionDTO.RecommendationResponse> getRecommendations(Long userId, String emotion, Double intensity, int limit) {
        List<Intervention> plans = interventionRepository.findByUserIdOrderByCreatedAtDesc(userId);
        if (plans.isEmpty()) {
            plans = initializeDefaultPlans(userId);
        }

        // 根据情绪筛选
        List<Intervention> filtered = plans;
        if (emotion != null && !emotion.isEmpty()) {
            filtered = plans.stream()
                    .filter(p -> p.getTargetEmotions() != null && p.getTargetEmotions().toLowerCase().contains(emotion.toLowerCase()))
                    .collect(Collectors.toList());
        }

        // 如果没有匹配的，返回所有活动计划
        if (filtered.isEmpty()) {
            filtered = plans.stream()
                    .filter(p -> p.getStatus() == Intervention.Status.ACTIVE)
                    .collect(Collectors.toList());
        }

        // 计算相关性分数
        return filtered.stream()
                .map(p -> {
                    double relevanceScore = calculateRelevanceScore(p, emotion, intensity);
                    return InterventionDTO.RecommendationResponse.builder()
                            .planId(p.getId())
                            .title(p.getTitle())
                            .description(p.getDescription())
                            .interventionType(p.getInterventionType())
                            .estimatedDuration(p.getDurationMinutes())
                            .relevanceScore(relevanceScore)
                            .reason(generateReason(p, emotion))
                            .build();
                })
                .sorted((a, b) -> Double.compare(b.getRelevanceScore(), a.getRelevanceScore()))
                .limit(limit > 0 ? limit : 5)
                .collect(Collectors.toList());
    }

    /**
     * 获取统计数据
     */
    public InterventionDTO.StatsResponse getStats(Long userId) {
        Long totalPlans = interventionRepository.countByUserId(userId);
        Long activePlans = interventionRepository.countActiveByUserId(userId);
        Long totalSessions = sessionRepository.countByUserId(userId);
        Long completedSessions = sessionRepository.countCompletedByUserId(userId);

        Map<String, Long> byType = new HashMap<>();
        List<Object[]> typeCounts = interventionRepository.countByType(userId);
        for (Object[] row : typeCounts) {
            String type = (String) row[0];
            Long count = (Long) row[1];
            if (type != null) {
                byType.put(type, count);
            }
        }

        return InterventionDTO.StatsResponse.builder()
                .totalPlans(totalPlans)
                .activePlans(activePlans)
                .totalSessions(totalSessions)
                .completedSessions(completedSessions)
                .completionRate(totalSessions > 0 ? (double) completedSessions / totalSessions : 0.0)
                .byType(byType)
                .build();
    }

    // ==================== 私有方法 ====================

    /**
     * 初始化默认干预计划
     */
    @Transactional
    public List<Intervention> initializeDefaultPlans(Long userId) {
        List<Intervention> plans = new ArrayList<>();

        for (Map<String, Object> template : DEFAULT_PLANS) {
            try {
                Intervention plan = Intervention.builder()
                        .userId(userId)
                        .title((String) template.get("title"))
                        .description((String) template.get("description"))
                        .interventionType((String) template.get("interventionType"))
                        .targetEmotions(objectMapper.writeValueAsString(template.get("targetEmotions")))
                        .steps(objectMapper.writeValueAsString(template.get("steps")))
                        .durationMinutes((Integer) template.get("durationMinutes"))
                        .status(Intervention.Status.ACTIVE)
                        .completionCount(0)
                        .build();

                plans.add(interventionRepository.save(plan));
            } catch (JsonProcessingException e) {
                log.error("序列化失败", e);
            }
        }

        return plans;
    }

    /**
     * 计算相关性分数
     */
    private double calculateRelevanceScore(Intervention plan, String emotion, Double intensity) {
        double score = 0.5; // 基础分数

        // 情绪匹配加分
        if (emotion != null && plan.getTargetEmotions() != null) {
            if (plan.getTargetEmotions().toLowerCase().contains(emotion.toLowerCase())) {
                score += 0.3;
            }
        }

        // 强度适合简单练习
        if (intensity != null && intensity > 0.7) {
            // 高强度时推荐简单练习
            if (plan.getDurationMinutes() != null && plan.getDurationMinutes() <= 15) {
                score += 0.1;
            }
        }

        // 完成次数少优先
        if (plan.getCompletionCount() != null && plan.getCompletionCount() < 3) {
            score += 0.1;
        }

        return Math.min(1.0, score);
    }

    /**
     * 生成推荐理由
     */
    private String generateReason(Intervention plan, String emotion) {
        if (emotion == null) {
            return "这是一个适合日常练习的干预方法";
        }

        return switch (plan.getInterventionType()) {
            case "breathing" -> "深呼吸练习可以帮助您快速平静下来";
            case "mindfulness" -> "正念冥想有助于培养情绪觉察力";
            case "cbt" -> "认知重构可以帮助改变消极思维模式";
            case "relaxation" -> "渐进式肌肉放松可以有效缓解身体紧张";
            case "exercise" -> "运动可以释放内啡肽，改善情绪";
            case "social" -> "社交连接可以提供情感支持";
            case "journaling" -> "书写表达可以帮助您理解和处理情绪";
            case "positive_psychology" -> "感恩练习可以培养积极情绪";
            default -> "这个干预方法可能对您有帮助";
        };
    }

    private InterventionDTO.PlanResponse toPlanResponse(Intervention plan) {
        List<String> targetEmotions = parseJsonList(plan.getTargetEmotions());
        List<String> steps = parseJsonList(plan.getSteps());

        return InterventionDTO.PlanResponse.builder()
                .id(plan.getId())
                .name(plan.getTitle())
                .title(plan.getTitle())
                .description(plan.getDescription())
                .interventionType(plan.getInterventionType())
                .difficultyLevel(plan.getDurationMinutes() != null ? plan.getDurationMinutes() / 10 : 1)
                .estimatedDuration(plan.getDurationMinutes())
                .isActive(plan.getStatus() == Intervention.Status.ACTIVE)
                .effectivenessScore(plan.getEffectivenessScore())
                .targetEmotions(targetEmotions)
                .steps(steps)
                .createdAt(plan.getCreatedAt() != null ? plan.getCreatedAt().toString() : null)
                .build();
    }

    private InterventionDTO.SessionResponse toSessionResponse(InterventionSession session) {
        return InterventionDTO.SessionResponse.builder()
                .id(session.getId())
                .planId(session.getPlanId())
                .isCompleted(session.getIsCompleted())
                .emotionBefore(session.getEmotionBefore())
                .emotionAfter(session.getEmotionAfter())
                .intensityBefore(session.getIntensityBefore())
                .intensityAfter(session.getIntensityAfter())
                .userRating(session.getUserRating())
                .startedAt(session.getStartedAt() != null ? session.getStartedAt().toString() : null)
                .completedAt(session.getCompletedAt() != null ? session.getCompletedAt().toString() : null)
                .build();
    }

    private List<String> parseJsonList(String json) {
        if (json == null || json.isEmpty()) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (JsonProcessingException e) {
            return new ArrayList<>();
        }
    }
}
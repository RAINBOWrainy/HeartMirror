package com.heartmirror.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.heartmirror.dto.QuestionnaireDTO;
import com.heartmirror.entity.QuestionnaireSession;
import com.heartmirror.repository.QuestionnaireSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 问卷评估服务
 * 支持PHQ-9、GAD-7、DASS-21量表
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class QuestionnaireService {

    private final QuestionnaireSessionRepository sessionRepository;
    private final ObjectMapper objectMapper;

    // ==================== 量表定义 ====================

    // PHQ-9 抑郁症筛查量表
    private static final Map<String, Object> PHQ9 = Map.of(
            "id", "phq9",
            "name", "PHQ-9 抑郁症筛查量表",
            "description", "用于筛查和评估抑郁症状的严重程度",
            "questions", List.of(
                    "做事时提不起劲或没有兴趣",
                    "感到心情低落、沮丧或绝望",
                    "入睡困难、易醒或睡眠过多",
                    "感觉疲倦或没有活力",
                    "食欲不振或吃得太多",
                    "觉得自己很糟，或觉得自己很失败，让自己或家人失望",
                    "对事物专注有困难，例如阅读报纸或看电视时",
                    "行动或说话速度缓慢到别人已经察觉，或者相反，烦躁或坐立不安、动来动去",
                    "有不如死掉或用某种方式伤害自己的念头"
            ),
            "options", List.of(
                    Map.of("value", 0, "label", "完全不会"),
                    Map.of("value", 1, "label", "几天"),
                    Map.of("value", 2, "label", "一半以上的天数"),
                    Map.of("value", 3, "label", "几乎每天")
            ),
            "maxScore", 27
    );

    // GAD-7 焦虑症筛查量表
    private static final Map<String, Object> GAD7 = Map.of(
            "id", "gad7",
            "name", "GAD-7 焦虑症筛查量表",
            "description", "用于筛查和评估焦虑症状的严重程度",
            "questions", List.of(
                    "感到紧张、焦虑或急切",
                    "不能停止或控制担忧",
                    "对各种各样的事情担忧过多",
                    "很难放松下来",
                    "由于不安而无法静坐",
                    "变得容易烦恼或急躁",
                    "感到似乎将有可怕的事情发生而害怕"
            ),
            "options", List.of(
                    Map.of("value", 0, "label", "完全不会"),
                    Map.of("value", 1, "label", "几天"),
                    Map.of("value", 2, "label", "一半以上的天数"),
                    Map.of("value", 3, "label", "几乎每天")
            ),
            "maxScore", 21
    );

    // DASS-21 抑郁焦虑压力量表
    private static final Map<String, Object> DASS21 = Map.of(
            "id", "dass21",
            "name", "DASS-21 抑郁焦虑压力量表",
            "description", "用于评估抑郁、焦虑和压力三种情绪状态",
            "questions", List.of(
                    "我发现很难让自己平静下来",
                    "我感到口干舌燥",
                    "我完全不能感受到任何积极的情绪",
                    "我感到呼吸困难（例如：过度换气、气喘）",
                    "我感到很难主动开始做事情",
                    "我对事情往往做出过度的反应",
                    "我感到发抖（例如：手部颤抖）",
                    "我感到耗费很多精力",
                    "我担心一些可能让自己恐慌或出丑的场合",
                    "我觉得自己没有什么可期待的了",
                    "我发现自己容易烦躁",
                    "我感到很难放松下来",
                    "我感到沮丧和低落",
                    "我无法忍受任何阻碍我继续工作的事情",
                    "我感到快要恐慌了",
                    "我对任何事情都无法产生热情",
                    "我觉得自己没有什么价值",
                    "我感到比较敏感",
                    "我出现了无明显原因的心率变化（例如：心率加快）",
                    "我毫无理由地感到害怕",
                    "我觉得生活毫无意义"
            ),
            "options", List.of(
                    Map.of("value", 0, "label", "不符合"),
                    Map.of("value", 1, "label", "有些符合"),
                    Map.of("value", 2, "label", "相当符合"),
                    Map.of("value", 3, "label", "非常符合")
            ),
            "maxScore", 63
    );

    private static final Map<String, Map<String, Object>> QUESTIONNAIRES = Map.of(
            "phq9", PHQ9,
            "gad7", GAD7,
            "dass21", DASS21
    );

    // ==================== 公开方法 ====================

    /**
     * 获取所有问卷类型
     */
    public List<QuestionnaireDTO.TypeResponse> getTypes() {
        return QUESTIONNAIRES.values().stream()
                .map(q -> QuestionnaireDTO.TypeResponse.builder()
                        .id((String) q.get("id"))
                        .name((String) q.get("name"))
                        .description((String) q.get("description"))
                        .questionCount(((List<?>) q.get("questions")).size())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * 获取问卷详情
     */
    public QuestionnaireDTO.TypeDetailResponse getTypeDetail(String type) {
        Map<String, Object> questionnaire = QUESTIONNAIRES.get(type.toLowerCase());
        if (questionnaire == null) {
            throw new RuntimeException("问卷类型不存在: " + type);
        }

        List<String> questions = (List<String>) questionnaire.get("questions");
        List<Map<String, Object>> options = (List<Map<String, Object>>) questionnaire.get("options");

        List<QuestionnaireDTO.Question> questionList = new ArrayList<>();
        for (int i = 0; i < questions.size(); i++) {
            questionList.add(QuestionnaireDTO.Question.builder()
                    .index(i)
                    .text(questions.get(i))
                    .build());
        }

        List<QuestionnaireDTO.Option> optionList = options.stream()
                .map(o -> QuestionnaireDTO.Option.builder()
                        .value((Integer) o.get("value"))
                        .label((String) o.get("label"))
                        .build())
                .collect(Collectors.toList());

        return QuestionnaireDTO.TypeDetailResponse.builder()
                .id((String) questionnaire.get("id"))
                .name((String) questionnaire.get("name"))
                .description((String) questionnaire.get("description"))
                .questions(questionList)
                .options(optionList)
                .questionCount(questions.size())
                .build();
    }

    /**
     * 开始问卷评估
     */
    @Transactional
    public QuestionnaireDTO.SessionResponse startQuestionnaire(Long userId, QuestionnaireDTO.StartRequest request) {
        String type = request.getQuestionnaireType().toLowerCase();
        if (!QUESTIONNAIRES.containsKey(type)) {
            throw new RuntimeException("问卷类型不存在: " + type);
        }

        Map<String, Object> questionnaire = QUESTIONNAIRES.get(type);
        int questionCount = ((List<?>) questionnaire.get("questions")).size();
        int maxScore = (Integer) questionnaire.get("maxScore");

        QuestionnaireSession session = QuestionnaireSession.builder()
                .userId(userId)
                .questionnaireType(type)
                .currentQuestionIndex(0)
                .maxScore(maxScore)
                .answers("[]")
                .dimensionScores("{}")
                .mode(request.getMode() != null ? request.getMode() : "conversational")
                .build();

        QuestionnaireSession saved = sessionRepository.save(session);
        return toSessionResponse(saved, questionCount);
    }

    /**
     * 提交答案
     */
    @Transactional
    public QuestionnaireDTO.SessionResponse submitAnswer(Long userId, QuestionnaireDTO.AnswerRequest request) {
        QuestionnaireSession session = sessionRepository.findByIdAndUserId(request.getSessionId(), userId)
                .orElseThrow(() -> new RuntimeException("会话不存在"));

        if (session.getIsCompleted()) {
            throw new RuntimeException("该评估已完成");
        }

        // 解析现有答案
        List<Integer> answers;
        try {
            answers = objectMapper.readValue(session.getAnswers(), new TypeReference<>() {});
        } catch (JsonProcessingException e) {
            answers = new ArrayList<>();
        }

        // 确保答案列表足够长
        while (answers.size() <= request.getQuestionIndex()) {
            answers.add(0);
        }

        // 更新答案
        answers.set(request.getQuestionIndex(), request.getAnswerValue());

        try {
            session.setAnswers(objectMapper.writeValueAsString(answers));
        } catch (JsonProcessingException e) {
            log.error("序列化答案失败", e);
        }

        // 更新当前问题索引
        Map<String, Object> questionnaire = QUESTIONNAIRES.get(session.getQuestionnaireType());
        int questionCount = ((List<?>) questionnaire.get("questions")).size();

        session.setCurrentQuestionIndex(request.getQuestionIndex() + 1);

        // 检查是否完成
        if (request.getQuestionIndex() >= questionCount - 1) {
            completeQuestionnaire(session, answers);
        }

        QuestionnaireSession saved = sessionRepository.save(session);
        return toSessionResponse(saved, questionCount);
    }

    /**
     * 获取会话详情
     */
    public QuestionnaireDTO.SessionDetailResponse getSession(Long userId, Long sessionId) {
        QuestionnaireSession session = sessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new RuntimeException("会话不存在"));

        Map<String, Object> questionnaire = QUESTIONNAIRES.get(session.getQuestionnaireType());
        List<String> questions = (List<String>) questionnaire.get("questions");
        List<Map<String, Object>> options = (List<Map<String, Object>>) questionnaire.get("options");

        QuestionnaireDTO.CurrentQuestion currentQuestion = null;
        if (!session.getIsCompleted() && session.getCurrentQuestionIndex() < questions.size()) {
            currentQuestion = QuestionnaireDTO.CurrentQuestion.builder()
                    .index(session.getCurrentQuestionIndex())
                    .text(questions.get(session.getCurrentQuestionIndex()))
                    .options(options.stream()
                            .map(o -> QuestionnaireDTO.Option.builder()
                                    .value((Integer) o.get("value"))
                                    .label((String) o.get("label"))
                                    .build())
                            .collect(Collectors.toList()))
                    .build();
        }

        return QuestionnaireDTO.SessionDetailResponse.builder()
                .id(session.getId())
                .questionnaireType(session.getQuestionnaireType())
                .isCompleted(session.getIsCompleted())
                .currentQuestion(currentQuestion)
                .progress(QuestionnaireDTO.Progress.builder()
                        .current(session.getCurrentQuestionIndex())
                        .total(questions.size())
                        .build())
                .startedAt(session.getStartedAt() != null ? session.getStartedAt().toString() : null)
                .build();
    }

    /**
     * 获取评估结果
     */
    public QuestionnaireDTO.ResultResponse getResult(Long userId, Long sessionId) {
        QuestionnaireSession session = sessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new RuntimeException("会话不存在"));

        if (!session.getIsCompleted()) {
            throw new RuntimeException("评估尚未完成");
        }

        return QuestionnaireDTO.ResultResponse.builder()
                .sessionId(session.getId())
                .questionnaireType(session.getQuestionnaireType())
                .totalScore(session.getTotalScore())
                .maxScore(session.getMaxScore())
                .riskLevel(session.getRiskLevel() != null ? session.getRiskLevel().name().toLowerCase() : "green")
                .interpretation(session.getInterpretation())
                .dimensionScores(parseDimensionScores(session.getDimensionScores()))
                .recommendations(generateRecommendations(session.getQuestionnaireType(), session.getRiskLevel()))
                .build();
    }

    /**
     * 获取历史记录
     */
    public List<QuestionnaireDTO.HistoryItem> getHistory(Long userId, int limit) {
        List<QuestionnaireSession> sessions = sessionRepository.findByUserIdOrderByStartedAtDesc(userId);
        return sessions.stream()
                .limit(limit > 0 ? limit : sessions.size())
                .map(s -> QuestionnaireDTO.HistoryItem.builder()
                        .id(s.getId())
                        .questionnaireType(s.getQuestionnaireType())
                        .totalScore(s.getTotalScore())
                        .riskLevel(s.getRiskLevel() != null ? s.getRiskLevel().name().toLowerCase() : null)
                        .isCompleted(s.getIsCompleted())
                        .startedAt(s.getStartedAt() != null ? s.getStartedAt().toString() : null)
                        .completedAt(s.getCompletedAt() != null ? s.getCompletedAt().toString() : null)
                        .build())
                .collect(Collectors.toList());
    }

    // ==================== 私有方法 ====================

    /**
     * 完成问卷并计算分数
     */
    private void completeQuestionnaire(QuestionnaireSession session, List<Integer> answers) {
        int totalScore = answers.stream().mapToInt(Integer::intValue).sum();

        session.setTotalScore(totalScore);
        session.setIsCompleted(true);

        // 计算风险等级
        QuestionnaireSession.RiskLevel riskLevel = calculateRiskLevel(session.getQuestionnaireType(), totalScore);
        session.setRiskLevel(riskLevel);

        // 生成解读
        String interpretation = generateInterpretation(session.getQuestionnaireType(), totalScore);
        session.setInterpretation(interpretation);

        // 计算维度分数（DASS-21特有）
        if ("dass21".equals(session.getQuestionnaireType())) {
            Map<String, Integer> dimensionScores = calculateDass21DimensionScores(answers);
            try {
                session.setDimensionScores(objectMapper.writeValueAsString(dimensionScores));
            } catch (JsonProcessingException e) {
                log.error("序列化维度分数失败", e);
            }
        }
    }

    /**
     * 计算风险等级
     */
    private QuestionnaireSession.RiskLevel calculateRiskLevel(String type, int totalScore) {
        return switch (type) {
            case "phq9" -> {
                if (totalScore <= 4) yield QuestionnaireSession.RiskLevel.GREEN;
                else if (totalScore <= 9) yield QuestionnaireSession.RiskLevel.YELLOW;
                else if (totalScore <= 14) yield QuestionnaireSession.RiskLevel.ORANGE;
                else if (totalScore <= 19) yield QuestionnaireSession.RiskLevel.RED;
                else yield QuestionnaireSession.RiskLevel.RED;
            }
            case "gad7" -> {
                if (totalScore <= 4) yield QuestionnaireSession.RiskLevel.GREEN;
                else if (totalScore <= 9) yield QuestionnaireSession.RiskLevel.YELLOW;
                else if (totalScore <= 14) yield QuestionnaireSession.RiskLevel.ORANGE;
                else yield QuestionnaireSession.RiskLevel.RED;
            }
            case "dass21" -> {
                // DASS-21需要乘以2转换为完整量表分数
                int scaledScore = totalScore * 2;
                // 简化评估：使用抑郁子量表分数
                int depScore = scaledScore / 3;
                if (depScore <= 9) yield QuestionnaireSession.RiskLevel.GREEN;
                else if (depScore <= 13) yield QuestionnaireSession.RiskLevel.YELLOW;
                else if (depScore <= 20) yield QuestionnaireSession.RiskLevel.ORANGE;
                else yield QuestionnaireSession.RiskLevel.RED;
            }
            default -> QuestionnaireSession.RiskLevel.GREEN;
        };
    }

    /**
     * 生成解读
     */
    private String generateInterpretation(String type, int totalScore) {
        return switch (type) {
            case "phq9" -> {
                if (totalScore <= 4) yield "您的抑郁症状处于正常范围内。继续保持良好的生活习惯，如有需要可以寻求心理咨询师的建议。";
                else if (totalScore <= 9) yield "您有轻度抑郁症状。建议关注自己的情绪变化，保持规律作息，适当运动，必要时可以寻求专业帮助。";
                else if (totalScore <= 14) yield "您有中度抑郁症状。建议您尽快咨询心理健康专业人士，获取适当的评估和治疗建议。";
                else if (totalScore <= 19) yield "您有中重度抑郁症状。强烈建议您尽快寻求专业心理健康服务，进行详细评估和治疗。";
                else yield "您有重度抑郁症状。请务必尽快寻求专业心理健康服务，如果有自伤或自杀的想法，请立即联系心理危机热线或就近就医。";
            }
            case "gad7" -> {
                if (totalScore <= 4) yield "您的焦虑症状处于正常范围内。继续保持良好的心态和生活方式。";
                else if (totalScore <= 9) yield "您有轻度焦虑症状。建议学习一些放松技巧，如深呼吸、正念冥想等，必要时可以寻求专业帮助。";
                else if (totalScore <= 14) yield "您有中度焦虑症状。建议您尽快咨询心理健康专业人士，获取适当的评估和治疗建议。";
                else yield "您有重度焦虑症状。强烈建议您尽快寻求专业心理健康服务，进行详细评估和治疗。";
            }
            case "dass21" -> {
                int scaledScore = totalScore * 2;
                if (scaledScore <= 30) yield "您的情绪状态整体良好。继续保持健康的生活方式，如有任何不适可以寻求帮助。";
                else if (scaledScore <= 50) yield "您有一定程度的情绪困扰。建议关注自己的情绪变化，尝试放松技巧，必要时寻求专业帮助。";
                else yield "您有较为明显的情绪困扰。建议您尽快咨询心理健康专业人士，获取详细的评估和治疗建议。";
            }
            default -> "评估已完成，请根据分数参考相关建议。";
        };
    }

    /**
     * 生成建议
     */
    private List<String> generateRecommendations(String type, QuestionnaireSession.RiskLevel riskLevel) {
        List<String> recommendations = new ArrayList<>();

        if (riskLevel == QuestionnaireSession.RiskLevel.RED) {
            recommendations.add("强烈建议您尽快寻求专业心理健康服务");
            recommendations.add("如果您有自伤或自杀的想法，请立即拨打心理危机热线：400-161-9995");
        } else if (riskLevel == QuestionnaireSession.RiskLevel.ORANGE) {
            recommendations.add("建议您咨询心理健康专业人士");
            recommendations.add("可以考虑进行更详细的心理评估");
        }

        recommendations.add("保持规律的作息时间");
        recommendations.add("进行适度的体育锻炼");
        recommendations.add("与家人朋友保持良好的沟通");

        if ("phq9".equals(type)) {
            recommendations.add("尝试参与让您感兴趣的活动");
            recommendations.add("设定小目标，逐步完成");
        } else if ("gad7".equals(type)) {
            recommendations.add("学习深呼吸和放松技巧");
            recommendations.add("尝试正念冥想练习");
        }

        return recommendations;
    }

    /**
     * 计算DASS-21维度分数
     */
    private Map<String, Integer> calculateDass21DimensionScores(List<Integer> answers) {
        // DASS-21维度：抑郁(3,5,10,13,16,17,21)、焦虑(2,4,7,9,15,19,20)、压力(1,6,8,11,12,14,18)
        // 注意：索引从0开始
        int depScore = answers.get(2) + answers.get(4) + answers.get(9) + answers.get(12) + answers.get(15) + answers.get(16) + answers.get(20);
        int anxScore = answers.get(1) + answers.get(3) + answers.get(6) + answers.get(8) + answers.get(14) + answers.get(18) + answers.get(19);
        int strScore = answers.get(0) + answers.get(5) + answers.get(7) + answers.get(10) + answers.get(11) + answers.get(13) + answers.get(17);

        // 乘以2转换为完整量表分数
        return Map.of(
                "depression", depScore * 2,
                "anxiety", anxScore * 2,
                "stress", strScore * 2
        );
    }

    /**
     * 解析维度分数
     */
    private Map<String, Integer> parseDimensionScores(String json) {
        if (json == null || json.isEmpty()) {
            return new HashMap<>();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (JsonProcessingException e) {
            return new HashMap<>();
        }
    }

    private QuestionnaireDTO.SessionResponse toSessionResponse(QuestionnaireSession session, int totalQuestions) {
        return QuestionnaireDTO.SessionResponse.builder()
                .id(session.getId())
                .questionnaireType(session.getQuestionnaireType())
                .currentQuestionIndex(session.getCurrentQuestionIndex())
                .totalQuestions(totalQuestions)
                .isCompleted(session.getIsCompleted())
                .totalScore(session.getTotalScore())
                .riskLevel(session.getRiskLevel() != null ? session.getRiskLevel().name().toLowerCase() : null)
                .startedAt(session.getStartedAt() != null ? session.getStartedAt().toString() : null)
                .completedAt(session.getCompletedAt() != null ? session.getCompletedAt().toString() : null)
                .build();
    }
}
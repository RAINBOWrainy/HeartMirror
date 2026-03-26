package com.heartmirror.service;

import com.heartmirror.dto.CrisisDTO;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * 危机支持服务
 * 提供心理危机热线、接地练习等静态资源
 */
@Service
public class CrisisService {

    // 全国及地区心理援助热线
    private static final List<CrisisDTO.CrisisResource> CRISIS_HOTLINES = List.of(
            CrisisDTO.CrisisResource.builder()
                    .name("全国心理援助热线")
                    .phone("400-161-9995")
                    .description("24小时心理危机干预热线")
                    .availableHours("24小时")
                    .region("全国")
                    .build(),
            CrisisDTO.CrisisResource.builder()
                    .name("北京心理危机研究与干预中心")
                    .phone("010-82951332")
                    .description("北京市心理危机干预热线")
                    .availableHours("24小时")
                    .region("北京")
                    .build(),
            CrisisDTO.CrisisResource.builder()
                    .name("上海心理援助热线")
                    .phone("021-34289888")
                    .description("上海市心理援助热线")
                    .availableHours("24小时")
                    .region("上海")
                    .build(),
            CrisisDTO.CrisisResource.builder()
                    .name("广州心理危机干预中心")
                    .phone("020-81899120")
                    .description("广州市心理危机干预热线")
                    .availableHours("24小时")
                    .region("广州")
                    .build(),
            CrisisDTO.CrisisResource.builder()
                    .name("深圳心理援助热线")
                    .phone("0755-25629459")
                    .description("深圳市心理援助热线")
                    .availableHours("24小时")
                    .region("深圳")
                    .build(),
            CrisisDTO.CrisisResource.builder()
                    .name("杭州心理危机干预热线")
                    .phone("0571-85029595")
                    .description("杭州市心理危机干预热线")
                    .availableHours("24小时")
                    .region("杭州")
                    .build(),
            CrisisDTO.CrisisResource.builder()
                    .name("南京心理危机干预热线")
                    .phone("025-83712977")
                    .description("南京市心理危机干预热线")
                    .availableHours("24小时")
                    .region("南京")
                    .build(),
            CrisisDTO.CrisisResource.builder()
                    .name("成都心理援助热线")
                    .phone("028-87577510")
                    .description("成都市心理援助热线")
                    .availableHours("24小时")
                    .region("成都")
                    .build(),
            CrisisDTO.CrisisResource.builder()
                    .name("武汉心理医院热线")
                    .phone("027-85836685")
                    .description("武汉市心理医院咨询热线")
                    .availableHours("8:00-22:00")
                    .region("武汉")
                    .build(),
            CrisisDTO.CrisisResource.builder()
                    .name("天津心理援助热线")
                    .phone("022-88188858")
                    .description("天津市心理援助热线")
                    .availableHours("24小时")
                    .region("天津")
                    .build(),
            CrisisDTO.CrisisResource.builder()
                    .name("重庆心理危机干预热线")
                    .phone("023-65345036")
                    .description("重庆市心理危机干预热线")
                    .availableHours("24小时")
                    .region("重庆")
                    .build()
    );

    // 即时行动指南
    private static final List<String> IMMEDIATE_ACTIONS = List.of(
            "深呼吸：慢慢吸气4秒，屏住呼吸4秒，慢慢呼气4秒，重复几次",
            "找一个安全、安静的地方坐下或躺下",
            "联系您信任的朋友或家人",
            "拨打心理援助热线寻求专业帮助",
            "如果您感到有自伤或伤人的风险，请立即拨打120或110"
    );

    // 接地练习
    private static final List<CrisisDTO.GroundingExercise> GROUNDING_EXERCISES = List.of(
            CrisisDTO.GroundingExercise.builder()
                    .name("5-4-3-2-1 感官接地法")
                    .description("通过关注五感来帮助自己回到当下")
                    .steps(List.of(
                            "看：找出周围5样你能看到的东西",
                            "触：找出4样你能触摸的东西",
                            "听：找出3种你能听到的声音",
                            "闻：找出2种你能闻到的气味",
                            "尝：找出1样你能尝到的味道"
                    ))
                    .duration("5-10分钟")
                    .build(),
            CrisisDTO.GroundingExercise.builder()
                    .name("深呼吸放松")
                    .description("通过控制呼吸来缓解紧张和焦虑")
                    .steps(List.of(
                            "找一个舒适的姿势坐下",
                            "一只手放在胸口，另一只手放在腹部",
                            "通过鼻子慢慢吸气4秒，感受腹部隆起",
                            "屏住呼吸4秒",
                            "通过嘴巴慢慢呼气6秒",
                            "重复5-10次"
                    ))
                    .duration("5分钟")
                    .build(),
            CrisisDTO.GroundingExercise.builder()
                    .name("身体扫描")
                    .description("通过关注身体各部位来放松身心")
                    .steps(List.of(
                            "找一个安静的地方躺下或坐下",
                            "闭上眼睛，深呼吸几次",
                            "从脚趾开始，感受身体的每个部位",
                            "注意任何紧张或不适的感觉",
                            "想象呼气时紧张感离开身体",
                            "逐渐向上移动，直到头部"
                    ))
                    .duration("10-15分钟")
                    .build(),
            CrisisDTO.GroundingExercise.builder()
                    .name("正念行走")
                    .description("通过专注行走来平静心灵")
                    .steps(List.of(
                            "找一个可以安全行走的地方",
                            "慢慢开始行走，注意每一步的感觉",
                            "感受脚与地面的接触",
                            "注意周围的声音、气味和景象",
                            "如果思绪飘走，温和地将注意力带回行走"
                    ))
                    .duration("10分钟")
                    .build()
    );

    // 安全计划步骤
    private static final List<CrisisDTO.SafetyPlanStep> SAFETY_PLAN_STEPS = List.of(
            CrisisDTO.SafetyPlanStep.builder()
                    .step(1)
                    .title("识别预警信号")
                    .description("识别那些表明危机正在发展的信号")
                    .examples(List.of(
                            "情绪突然变得很低落或烦躁",
                            "睡眠质量明显下降",
                            "开始有自我否定的想法",
                            "社交活动减少"
                    ))
                    .build(),
            CrisisDTO.SafetyPlanStep.builder()
                    .step(2)
                    .title("内部应对策略")
                    .description("可以自己做的缓解情绪的活动")
                    .examples(List.of(
                            "做深呼吸练习",
                            "听舒缓的音乐",
                            "进行适度的运动",
                            "写日记或画画"
                    ))
                    .build(),
            CrisisDTO.SafetyPlanStep.builder()
                    .step(3)
                    .title("社交分散注意力")
                    .description("可以提供积极社交互动的人和场所")
                    .examples(List.of(
                            "联系好朋友或家人",
                            "去公园或咖啡厅",
                            "参加社区活动"
                    ))
                    .build(),
            CrisisDTO.SafetyPlanStep.builder()
                    .step(4)
                    .title("可以寻求帮助的人")
                    .description("在危机时可以联系的人")
                    .examples(List.of(
                            "家人：记录他们的电话号码",
                            "朋友：记录他们的电话号码",
                            "专业咨询师：记录他们的联系方式"
                    ))
                    .build(),
            CrisisDTO.SafetyPlanStep.builder()
                    .step(5)
                    .title("专业资源")
                    .description("可用的专业帮助资源")
                    .examples(List.of(
                            "心理援助热线：400-161-9995",
                            "当地医院心理科",
                            "社区心理服务中心"
                    ))
                    .build()
    );

    /**
     * 获取所有危机资源
     */
    public CrisisDTO.ResourcesResponse getResources() {
        return CrisisDTO.ResourcesResponse.builder()
                .message("以下是可以帮助您的资源")
                .hotlines(CRISIS_HOTLINES)
                .onlineResources(List.of(
                        CrisisDTO.CrisisResource.builder()
                                .name("中国精神卫生网")
                                .description("心理健康知识和资源")
                                .availableHours("在线")
                                .region("全国")
                                .build()
                ))
                .build();
    }

    /**
     * 获取热线信息
     */
    public CrisisDTO.HotlineResponse getHotline() {
        return CrisisDTO.HotlineResponse.builder()
                .nationalHotline("400-161-9995")
                .emergency("120")
                .police("110")
                .message("如果您正处于危机状态，请立即拨打以下热线寻求帮助")
                .regionalHotlines(CRISIS_HOTLINES)
                .build();
    }

    /**
     * 获取安全计划模板
     */
    public CrisisDTO.SafetyPlanResponse getSafetyPlan() {
        return CrisisDTO.SafetyPlanResponse.builder()
                .message("安全计划可以帮助您在危机时刻保护自己")
                .steps(SAFETY_PLAN_STEPS)
                .build();
    }

    /**
     * 获取即时帮助
     */
    public CrisisDTO.ImmediateHelpResponse getImmediateHelp() {
        return CrisisDTO.ImmediateHelpResponse.builder()
                .message("如果您现在感到很难受，请尝试以下方法")
                .resources(CRISIS_HOTLINES.subList(0, 3))
                .immediateActions(IMMEDIATE_ACTIONS)
                .build();
    }

    /**
     * 获取接地练习
     */
    public CrisisDTO.GroundingExercisesResponse getGroundingExercises() {
        return CrisisDTO.GroundingExercisesResponse.builder()
                .exercises(GROUNDING_EXERCISES)
                .build();
    }
}
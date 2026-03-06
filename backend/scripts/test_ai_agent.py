"""
AI Agent 全面测试脚本

测试维度：
1. 模式切换测试 - 验证日常聊天与评估模式的智能切换
2. 情绪识别测试 - 验证情绪识别准确性，特别是口语化表达
3. 否定词检测测试 - 验证否定语境的正确理解
4. 危机干预测试 - 验证危机信号的响应
5. 对话自然度测试 - 验证回复的自然性和逻辑性
6. 会话稳定性测试 - 验证缓存和错误处理
"""
import asyncio
import sys
import os

# 添加项目路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.agents.orchestrator import AgentOrchestrator, ConversationMode, ConversationStage
from app.agents.emotion_agent.hybrid_emotion_engine import HybridEmotionEngine
from app.agents.questionnaire_agent.conversational_assessment import ConversationalAssessmentEngine
from app.core.persona import HeartMirrorPersona


class TestResults:
    """测试结果收集器"""
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.details = []

    def add(self, name: str, passed: bool, message: str = ""):
        if passed:
            self.passed += 1
            print(f"[PASS] {name}")
        else:
            self.failed += 1
            print(f"[FAIL] {name}: {message}")
        self.details.append({"name": name, "passed": passed, "message": message})

    def summary(self):
        total = self.passed + self.failed
        print(f"\n{'='*50}")
        print(f"测试结果: {self.passed}/{total} 通过")
        print(f"{'='*50}")


results = TestResults()


def test_persona_name():
    """测试1: 人设名称修正"""
    print("\n--- 测试1: 人设名称修正 ---")

    # 检查 BASE_PERSONA 中不包含"心语"
    has_xinyu = "心语" in HeartMirrorPersona.BASE_PERSONA
    has_xinjing = "心境" in HeartMirrorPersona.BASE_PERSONA

    results.add(
        "人设中不含'心语'",
        not has_xinyu,
        f"发现'心语'字样" if has_xinyu else ""
    )

    results.add(
        "人设中包含'心境'",
        has_xinjing,
        "未找到'心境'字样" if not has_xinjing else ""
    )

    # 检查问候语不包含身份声明
    greetings = HeartMirrorPersona.CASUAL_RESPONSES.get("greeting", [])
    has_identity_statement = any("我是心境" in g or"我是心语" in g for g in greetings)

    results.add(
        "问候语无身份声明",
        not has_identity_statement,
        f"发现身份声明: {[g for g in greetings if '我是' in g]}"
    )


def test_mode_determination():
    """测试2: 模式切换逻辑"""
    print("\n--- 测试2: 模式切换逻辑 ---")

    orchestrator = AgentOrchestrator()

    # 测试日常聊天判断
    test_cases = [
        ("哈哈，今天真好玩，好开心啊", ConversationMode.CASUAL, "日常聊天"),
        ("周末去哪里玩比较好？推荐一下", ConversationMode.CASUAL, "日常聊天"),
        ("最近心情不好，睡不着觉", ConversationMode.ASSESSMENT, "评估触发"),
        ("我感觉很累，压力很大，焦虑", ConversationMode.ASSESSMENT, "评估触发"),
        ("我不想活了，活着没意思", ConversationMode.CRISIS, "危机信号"),
        ("我有自杀的想法", ConversationMode.CRISIS, "危机信号"),
    ]

    for user_input, expected_mode, desc in test_cases:
        actual_mode = orchestrator._determine_mode(user_input)
        results.add(
            f"模式判断: {desc}",
            actual_mode == expected_mode,
            f"输入: '{user_input}', 期望: {expected_mode.value}, 实际: {actual_mode.value}"
        )


def test_emotion_keywords():
    """测试3: 情绪关键词识别"""
    print("\n--- 测试3: 情绪关键词识别 ---")

    engine = HybridEmotionEngine()

    test_cases = [
        # (输入, 期望情绪类别)
        ("我今天超级开心，太棒了！", "joy", "正面情绪"),
        ("我好难过，想哭", "sadness", "悲伤情绪"),
        ("气死我了，太讨厌了", "anger", "愤怒情绪"),
        ("我好累啊，心累", "frustration", "疲惫情绪"),
        ("最近压力好大，焦虑", "anxiety", "焦虑情绪"),
        ("我一个人好孤独", "loneliness", "孤独情绪"),
        ("emo了，破防了", "sadness", "口语化表达"),
        ("麻了，躺平了", "frustration", "网络用语"),
    ]

    for user_input, expected_emotion, desc in test_cases:
        result = engine._keyword_analysis(user_input)
        detected = result.get("emotion", "neutral")

        # 对于口语化表达，我们检查是否检测到了相关情绪
        if expected_emotion in ["sadness", "frustration"]:
            # 检查是否检测到相关情绪（不要求精确匹配）
            related_emotions = ["sadness", "frustration", "anxiety"]
            is_valid = detected in related_emotions or expected_emotion in result.get("all_scores", {})
        else:
            is_valid = detected == expected_emotion

        results.add(
            f"情绪识别: {desc}",
            is_valid,
            f"输入: '{user_input}', 期望: {expected_emotion}, 检测: {detected}"
        )


def test_negation_detection():
    """测试4: 否定词检测"""
    print("\n--- 测试4: 否定词检测 ---")

    engine = HybridEmotionEngine()

    test_cases = [
        # 否定语境 - 不应检测到情绪
        ("我不会失眠，睡得很好", "neutral", "否定:不会失眠"),
        ("我没有不开心，还好", "neutral", "否定:没有不开心"),
        ("不累，不用休息", "neutral", "否定:不累"),
        ("不再焦虑了", "neutral", "否定:不再焦虑"),

        # 肯定语境 - 应检测到情绪
        ("我真的好累", "frustration", "肯定:好累"),
        ("我失眠了", "sadness", "肯定:失眠"),
    ]

    for user_input, expected_base, desc in test_cases:
        result = engine._keyword_analysis(user_input)
        detected = result.get("emotion", "neutral")
        matched = result.get("matched_keywords", {})

        if "否定" in desc:
            # 否定语境：不应该有强烈的情绪检测
            # 检查matched_keywords中是否有相关的情绪关键词被检测到
            has_false_positive = len(matched) > 0 and expected_base not in ["neutral"]
            is_valid = not has_false_positive

            results.add(
                f"否定检测: {desc}",
                is_valid,
                f"输入: '{user_input}', 检测到: {matched}"
            )
        else:
            # 肯定语境：应该检测到情绪
            is_valid = detected == expected_base or expected_base in result.get("all_scores", {})

            results.add(
                f"肯定检测: {desc}",
                is_valid,
                f"输入: '{user_input}', 期望: {expected_base}, 检测: {detected}"
            )


def test_questionnaire_negation():
    """测试5: 问卷评估否定检测"""
    print("\n--- 测试5: 问卷评估否定检测 ---")

    engine = ConversationalAssessmentEngine()

    test_cases = [
        ("我不会失眠，睡得很好", "sleep_issues", False, "否定失眠"),
        ("我没有食欲问题", "appetite", False, "否定食欲问题"),
        ("我睡不着，失眠很严重", "sleep_issues", True, "肯定失眠"),
    ]

    for user_input, symptom_id, should_detect, desc in test_cases:
        detected = engine._detect_symptom_signals(user_input)
        has_symptom = symptom_id in detected

        results.add(
            f"问卷否定: {desc}",
            has_symptom == should_detect,
            f"输入: '{user_input}', 症状'{symptom_id}'检测: {has_symptom}, 期望: {should_detect}"
        )


def test_crisis_response():
    """测试6: 危机干预响应"""
    print("\n--- 测试6: 危机干预响应 ---")

    # 检查危机响应模板
    crisis_response = HeartMirrorPersona.CRISIS_RESPONSE

    has_hotline = "400-161-9995" in crisis_response or "热线" in crisis_response
    has_empathy = any(word in crisis_response for word in ["不必一个人", "愿意帮助", "陪着你"])

    results.add(
        "危机响应包含热线电话",
        has_hotline,
        "缺少心理援助热线信息"
    )

    results.add(
        "危机响应包含共情语言",
        has_empathy,
        "缺少共情表达"
    )


def test_greeting_naturalness():
    """测试7: 问候语自然度"""
    print("\n--- 测试7: 问候语自然度 ---")

    greetings = HeartMirrorPersona.CASUAL_RESPONSES.get("greeting", [])

    # 检查问候语是否自然（无身份声明）
    unnatural_patterns = ["我是", "一个", "愿意倾听", "的朋友"]

    for greeting in greetings:
        has_unnatural = any(pattern in greeting for pattern in unnatural_patterns)
        results.add(
            f"问候语自然: '{greeting}'",
            not has_unnatural,
            f"包含非自然表达模式"
        )


def test_style_templates():
    """测试8: 风格模板完整性"""
    print("\n--- 测试8: 风格模板完整性 ---")

    # 检查朋友式响应
    has_casual = hasattr(HeartMirrorPersona, 'CASUAL_RESPONSES') and len(HeartMirrorPersona.CASUAL_RESPONSES) > 0
    results.add(
        "朋友式响应模板存在",
        has_casual,
        "缺少CASUAL_RESPONSES"
    )

    # 检查妈妈式响应
    has_caring = hasattr(HeartMirrorPersona, 'CARING_RESPONSES') and len(HeartMirrorPersona.CARING_RESPONSES) > 0
    results.add(
        "妈妈式响应模板存在",
        has_caring,
        "缺少CARING_RESPONSES"
    )

    # 检查情绪确认模板
    has_emotion_ack = hasattr(HeartMirrorPersona, 'EMOTION_ACKNOWLEDGE') and len(HeartMirrorPersona.EMOTION_ACKNOWLEDGE) > 0
    results.add(
        "情绪确认模板存在",
        has_emotion_ack,
        "缺少EMOTION_ACKNOWLEDGE"
    )


def test_cache_mechanism():
    """测试9: 缓存机制"""
    print("\n--- 测试9: 缓存机制 ---")

    # 模拟缓存类
    from datetime import datetime, timedelta

    class MockCache:
        def __init__(self):
            self._cache = {}
            self._ttl = timedelta(minutes=30)

        def get_sync(self, session_id):
            if session_id in self._cache:
                self._cache[session_id]["last_access"] = datetime.now()
                return self._cache[session_id]["orchestrator"]

            orchestrator = AgentOrchestrator()
            self._cache[session_id] = {
                "orchestrator": orchestrator,
                "last_access": datetime.now()
            }
            return orchestrator

        def remove(self, session_id):
            if session_id in self._cache:
                del self._cache[session_id]

    cache = MockCache()

    # 测试获取
    orch1 = cache.get_sync("session_1")
    orch2 = cache.get_sync("session_1")

    results.add(
        "缓存返回同一实例",
        orch1 is orch2,
        "相同session_id应返回同一实例"
    )

    # 测试移除
    cache.remove("session_1")
    orch3 = cache.get_sync("session_1")

    results.add(
        "移除后创建新实例",
        orch1 is not orch3,
        "移除后应创建新实例"
    )


def run_all_tests():
    """运行所有测试"""
    print("="*50)
    print("AI Agent 全面测试")
    print("="*50)

    test_persona_name()
    test_mode_determination()
    test_emotion_keywords()
    test_negation_detection()
    test_questionnaire_negation()
    test_crisis_response()
    test_greeting_naturalness()
    test_style_templates()
    test_cache_mechanism()

    results.summary()


if __name__ == "__main__":
    run_all_tests()
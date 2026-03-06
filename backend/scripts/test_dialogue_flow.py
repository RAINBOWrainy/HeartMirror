"""
AI Agent 对话场景测试

模拟真实对话场景，验证 AI Agent 的对话能力
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 设置环境变量避免警告
os.environ.setdefault('JWT_SECRET_KEY', 'test-secret-key-for-testing-only')
os.environ.setdefault('SECRET_KEY', 'test-secret-key-for-testing-only')

from app.agents.orchestrator import AgentOrchestrator, ConversationMode
from app.core.persona import HeartMirrorPersona


class DialogueTest:
    """对话场景测试"""

    def __init__(self):
        self.orchestrator = AgentOrchestrator()
        self.results = []

    async def test_scenario(self, name: str, messages: list) -> dict:
        """测试对话场景"""
        print(f"\n{'='*50}")
        print(f"场景: {name}")
        print(f"{'='*50}")

        # 重置 orchestrator
        self.orchestrator.reset()
        self.orchestrator.mode = ConversationMode.CASUAL

        conversation = []
        for i, user_msg in enumerate(messages):
            print(f"\n[用户]: {user_msg}")

            result = await self.orchestrator.process_message(user_msg)
            response = result.get("response", "")
            mode = result.get("mode", "unknown")
            emotion = result.get("emotion_detected", "none")

            print(f"[AI]: {response}")
            print(f"[模式: {mode}, 情绪: {emotion}]")

            conversation.append({
                "user": user_msg,
                "ai": response,
                "mode": mode,
                "emotion": emotion
            })

        return {
            "name": name,
            "conversation": conversation,
            "final_mode": self.orchestrator.mode.value
        }

    def check_response_quality(self, response: str, user_msg: str) -> dict:
        """检查响应质量"""
        issues = []

        # 检查是否有机械化表达
        mechanical_patterns = [
            "我检测到", "根据分析", "为您推荐", "请选择",
            "我是心境", "我是心语", "一个愿意倾听"
        ]
        for pattern in mechanical_patterns:
            if pattern in response:
                issues.append(f"机械化表达: '{pattern}'")

        # 检查响应是否过短
        if len(response) < 5:
            issues.append("响应过短")

        # 检查响应是否过长
        if len(response) > 500:
            issues.append("响应过长")

        return {
            "has_issues": len(issues) > 0,
            "issues": issues
        }


async def run_dialogue_tests():
    """运行对话测试"""
    tester = DialogueTest()

    print("="*60)
    print("AI Agent 对话场景测试")
    print("="*60)

    # 场景1: 日常闲聊
    result1 = await tester.test_scenario(
        "日常闲聊",
        [
            "你好呀",
            "今天天气真不错",
            "哈哈，是啊，心情都变好了",
            "最近有什么好玩的事吗？",
            "周末打算去爬山，推荐一下装备？"
        ]
    )

    # 场景2: 情绪倾诉
    result2 = await tester.test_scenario(
        "情绪倾诉",
        [
            "最近心情不太好",
            "工作压力太大了，感觉好累",
            "每天加班到很晚，都没时间休息",
            "谢谢你听我说这些"
        ]
    )

    # 场景3: 否定语境测试
    result3 = await tester.test_scenario(
        "否定语境",
        [
            "你好",
            "我不会失眠，睡得很好",
            "其实我最近心情还行，没什么大问题",
            "就是想找个人聊聊天"
        ]
    )

    # 场景4: 口语化表达
    result4 = await tester.test_scenario(
        "口语化表达",
        [
            "emo了",
            "最近麻了，什么都不想干",
            "破防了，感觉好累啊"
        ]
    )

    # 场景5: 危机信号
    result5 = await tester.test_scenario(
        "危机信号",
        [
            "你好",
            "我最近感觉很痛苦",
            "活着没意思"
        ]
    )

    # 检查响应质量
    print("\n" + "="*60)
    print("响应质量检查")
    print("="*60)

    all_results = [result1, result2, result3, result4, result5]
    total_issues = 0

    for result in all_results:
        print(f"\n--- {result['name']} ---")
        for turn in result['conversation']:
            quality = tester.check_response_quality(turn['ai'], turn['user'])
            if quality['has_issues']:
                total_issues += len(quality['issues'])
                for issue in quality['issues']:
                    print(f"  [问题] {issue}")

    print("\n" + "="*60)
    print(f"总问题数: {total_issues}")
    print("="*60)

    # 总结
    print("\n场景模式切换总结:")
    for result in all_results:
        print(f"  {result['name']}: 最终模式 = {result['final_mode']}")


async def test_individual_responses():
    """测试单个响应"""
    print("\n" + "="*60)
    print("单响应测试")
    print("="*60)

    test_cases = [
        ("我好累啊", "应识别为frustration而非joy"),
        ("我不会失眠", "不应检测到睡眠问题"),
        ("emo了", "应识别为负面情绪"),
        ("哈哈，太好玩了", "应识别为喜悦"),
        ("不想活了", "应触发危机模式"),
    ]

    orchestrator = AgentOrchestrator()

    for user_msg, expected in test_cases:
        orchestrator.reset()
        result = await orchestrator.process_message(user_msg)

        mode = result.get("mode", "unknown")
        emotion = result.get("emotion_detected", "none")
        response = result.get("response", "")

        print(f"\n输入: {user_msg}")
        print(f"期望: {expected}")
        print(f"实际: 模式={mode}, 情绪={emotion}")
        print(f"响应: {response[:100]}...")


if __name__ == "__main__":
    asyncio.run(run_dialogue_tests())
    asyncio.run(test_individual_responses())
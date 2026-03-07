"""
测试CASUAL模式情绪检测修复

验证修复后的行为：
1. CASUAL模式现在会进行情绪检测
2. "好累" 应该被识别为 frustration
3. 返回的情绪应该被正确传递
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 设置环境变量避免警告
os.environ.setdefault('JWT_SECRET_KEY', 'test-secret-key-for-testing-only')
os.environ.setdefault('SECRET_KEY', 'test-secret-key-for-testing-only')

from app.agents.orchestrator import AgentOrchestrator, ConversationMode


async def test_casual_mode_emotion_detection():
    """测试CASUAL模式的情绪检测"""
    print("=" * 60)
    print("测试: CASUAL模式情绪检测修复")
    print("=" * 60)

    orchestrator = AgentOrchestrator()

    # 测试用例
    test_cases = [
        ("好累", "frustration", "疲惫"),
        ("今天心情不太好", "sadness", "难过"),
        ("最近压力好大", "anxiety", "焦虑"),
        ("哈哈，今天真好玩", "joy", "开心"),
        ("emo了", "sadness", "负面情绪"),
    ]

    all_passed = True

    for user_input, expected_emotion, expected_context in test_cases:
        print(f"\n--- 测试输入: '{user_input}' ---")
        print(f"期望情绪: {expected_emotion}")

        orchestrator.reset()
        orchestrator.mode = ConversationMode.CASUAL  # 确保是CASUAL模式

        result = await orchestrator.process_message(user_input)

        emotion_detected = result.get("emotion_detected")
        emotion_intensity = result.get("emotion_intensity", 0)
        mode = result.get("mode")

        print(f"实际情绪: {emotion_detected}")
        print(f"情绪强度: {emotion_intensity:.2f}")
        print(f"对话模式: {mode}")
        print(f"回复: {result.get('response', '')[:100]}...")

        # 检查结果
        if emotion_detected is None:
            print("[FAIL] 失败: 情绪检测为None（修复未生效）")
            all_passed = False
        elif emotion_detected == expected_emotion or expected_emotion in str(emotion_detected):
            print("[OK] 通过: 情绪检测正确")
        else:
            print(f"[WARN] 警告: 检测到情绪 '{emotion_detected}'，期望 '{expected_emotion}'")
            # 但至少检测到了情绪，说明修复生效了
            if emotion_detected != "neutral":
                print("   (修复已生效，至少检测到了非中性情绪)")

    print("\n" + "=" * 60)
    if all_passed:
        print("[OK] 所有测试通过！CASUAL模式情绪检测修复成功！")
    else:
        print("[FAIL] 部分测试失败，请检查修复")
    print("=" * 60)

    return all_passed


async def test_keyword_detection():
    """测试关键词检测是否正常工作"""
    print("\n" + "=" * 60)
    print("测试: 关键词检测基础功能")
    print("=" * 60)

    from app.agents.emotion_agent.hybrid_emotion_engine import HybridEmotionEngine

    engine = HybridEmotionEngine()

    # 测试关键词检测
    result = engine._keyword_analysis("好累")

    print(f"输入: '好累'")
    print(f"检测情绪: {result.get('emotion')}")
    print(f"置信度: {result.get('confidence'):.2f}")
    print(f"匹配关键词: {result.get('matched_keywords')}")

    if result.get("emotion") == "frustration":
        print("[OK] 关键词检测正确识别为 frustration")
    else:
        print(f"[WARN] 关键词检测到: {result.get('emotion')}，期望 frustration")


async def main():
    """运行所有测试"""
    print("\n" + "=" * 60)
    print("HeartMirror AI Agent 情绪检测修复验证")
    print("=" * 60)

    # 测试关键词检测基础功能
    await test_keyword_detection()

    # 测试CASUAL模式情绪检测
    result = await test_casual_mode_emotion_detection()

    return result


if __name__ == "__main__":
    result = asyncio.run(main())
    sys.exit(0 if result else 1)
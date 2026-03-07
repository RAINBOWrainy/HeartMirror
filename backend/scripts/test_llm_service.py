"""
Test LLM Service
测试OpenRouter LLM集成
"""
import sys
import os
import asyncio

# 设置控制台编码为UTF-8
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.llm_service import LLMService, get_llm_service


async def test_llm_basic():
    """测试基本LLM调用"""
    print("=" * 50)
    print("测试1: 基本LLM调用")
    print("=" * 50)

    llm = get_llm_service()

    try:
        response = await llm.generate(
            prompt="你好，请简单介绍一下你自己。",
            system_prompt="你是一个友好的AI助手。",
            temperature=0.7,
            max_tokens=100
        )
        print(f"响应: {response}")
        print("[PASS] 测试通过")
        return response
    except Exception as e:
        print(f"[FAIL] 测试失败: {e}")
        return None


async def test_llm_chat():
    """测试对话响应生成"""
    print("\n" + "=" * 50)
    print("测试2: 对话响应生成")
    print("=" * 50)

    llm = get_llm_service()

    try:
        response = await llm.generate_chat_response(
            user_input="最近感觉有点焦虑，不知道该怎么办。",
            conversation_history=[],
            emotion_detected="焦虑",
            risk_level="green"
        )
        print(f"响应: {response}")
        print("[PASS] 测试通过")
        return response
    except Exception as e:
        print(f"[FAIL] 测试失败: {e}")
        return None


async def test_llm_questionnaire():
    """测试问卷问题生成"""
    print("\n" + "=" * 50)
    print("测试3: 问卷问题生成")
    print("=" * 50)

    llm = get_llm_service()

    try:
        response = await llm.generate_questionnaire_question(
            context={
                "assessed_areas": ["mood"],
                "detected_symptoms": ["焦虑"],
                "risk_level": "green",
                "last_response": "最近感觉有点累"
            }
        )
        print(f"生成的问题: {response}")
        print("[PASS] 测试通过")
        return response
    except Exception as e:
        print(f"[FAIL] 测试失败: {e}")
        return None


async def test_llm_intervention():
    """测试干预建议生成"""
    print("\n" + "=" * 50)
    print("测试4: 干预建议生成")
    print("=" * 50)

    llm = get_llm_service()

    try:
        response = await llm.generate_intervention_suggestion(
            user_context={
                "symptoms": ["焦虑", "疲劳"],
                "risk_level": "green"
            },
            emotion_state={"emotion": "焦虑", "intensity": 0.6}
        )
        print(f"干预建议: {response}")
        print("[PASS] 测试通过")
        return response
    except Exception as e:
        print(f"[FAIL] 测试失败: {e}")
        return None


async def main():
    """运行所有测试"""
    print("\n" + "=" * 60)
    print("OpenRouter LLM服务测试")
    print("模型: arcee-ai/trinity-large-preview:free")
    print("=" * 60)

    results = []

    # 运行测试
    results.append(await test_llm_basic())
    results.append(await test_llm_chat())
    results.append(await test_llm_questionnaire())
    results.append(await test_llm_intervention())

    print("\n" + "=" * 60)
    print("测试完成")
    print("=" * 60)

    # 统计结果
    passed = sum(1 for r in results if r is not None)
    print(f"\n通过: {passed}/4 测试")

    return results


if __name__ == "__main__":
    asyncio.run(main())
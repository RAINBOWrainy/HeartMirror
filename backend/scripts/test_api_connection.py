"""
API Connection Test Script
测试OpenRouter API连接并诊断问题

功能：
1. 测试API Key有效性
2. 测试模型可用性
3. 测试多种免费模型
4. 输出详细诊断信息
"""
import sys
import os
import asyncio
import time
from typing import Optional, List, Dict, Any

# 设置控制台编码为UTF-8
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    import httpx
    from openai import OpenAI
    HAS_DEPS = True
except ImportError as e:
    HAS_DEPS = False
    print(f"[ERROR] 缺少依赖: {e}")
    print("请运行: pip install httpx openai")

from app.config import settings


class APIDiagnostics:
    """API诊断工具"""

    # 推荐的免费模型列表（按稳定性排序）
    RECOMMENDED_FREE_MODELS = [
        "deepseek/deepseek-chat:free",
        "google/gemma-2-9b-it:free",
        "meta-llama/llama-3-8b-instruct:free",
        "qwen/qwen-2-7b-instruct:free",
        "mistralai/mistral-7b-instruct:free",
        "arcee-ai/trinity-large-preview:free",
        "stepfun/step-3.5-flash:free",
    ]

    def __init__(self):
        self.api_key = settings.OPENROUTER_API_KEY
        self.base_url = settings.OPENROUTER_BASE_URL
        self.model = settings.LLM_MODEL
        self.results = []

    def print_header(self, title: str):
        """打印标题"""
        print("\n" + "=" * 60)
        print(f"  {title}")
        print("=" * 60)

    def print_result(self, test_name: str, success: bool, message: str = ""):
        """打印测试结果"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} | {test_name}")
        if message:
            print(f"      └─ {message}")
        self.results.append({"test": test_name, "success": success, "message": message})

    def test_api_key_format(self) -> bool:
        """测试API Key格式"""
        self.print_header("测试1: API Key格式")

        if not self.api_key:
            self.print_result("API Key存在", False, "API Key为空")
            return False

        self.print_result("API Key存在", True, f"Key长度: {len(self.api_key)}字符")

        if self.api_key.startswith("sk-or-v1-"):
            self.print_result("API Key格式正确", True, "以 sk-or-v1- 开头")
        else:
            self.print_result("API Key格式正确", False, "应以 sk-or-v1- 开头")
            return False

        return True

    async def test_api_connection(self) -> bool:
        """测试API基础连接"""
        self.print_header("测试2: API基础连接")

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # 测试OpenRouter API端点
                response = await client.get(
                    f"{self.base_url}/models",
                    headers={"Authorization": f"Bearer {self.api_key}"}
                )

                if response.status_code == 200:
                    self.print_result("API连接成功", True, f"状态码: {response.status_code}")
                    return True
                else:
                    self.print_result("API连接成功", False, f"状态码: {response.status_code}")
                    return False

        except httpx.TimeoutException:
            self.print_result("API连接成功", False, "连接超时")
            return False
        except Exception as e:
            self.print_result("API连接成功", False, f"错误: {str(e)}")
            return False

    async def test_model(self, model_name: str) -> Dict[str, Any]:
        """测试单个模型"""
        result = {
            "model": model_name,
            "success": False,
            "response_time": 0,
            "error": None,
            "response": None
        }

        client = OpenAI(
            base_url=self.base_url,
            api_key=self.api_key,
            default_headers={
                "HTTP-Referer": "https://heartmirror.app",
                "X-Title": "HeartMirror"
            }
        )

        try:
            start_time = time.time()

            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": "你是一个友好的AI助手。"},
                    {"role": "user", "content": "你好，请简单回复。"}
                ],
                max_tokens=50,
                temperature=0.7
            )

            elapsed = time.time() - start_time

            result["success"] = True
            result["response_time"] = round(elapsed, 2)
            result["response"] = response.choices[0].message.content

        except Exception as e:
            result["error"] = str(e)

        return result

    async def test_current_model(self) -> bool:
        """测试当前配置的模型"""
        self.print_header("测试3: 当前模型")

        print(f"当前模型: {self.model}")
        print("正在测试...")

        result = await self.test_model(self.model)

        if result["success"]:
            self.print_result(
                f"模型 {self.model} 可用",
                True,
                f"响应时间: {result['response_time']}秒"
            )
            print(f"      └─ 响应: {result['response'][:100]}...")
            return True
        else:
            self.print_result(
                f"模型 {self.model} 可用",
                False,
                f"错误: {result['error']}"
            )
            return False

    async def test_alternative_models(self) -> List[Dict]:
        """测试备用模型"""
        self.print_header("测试4: 备用模型")

        print("正在测试推荐的免费模型...\n")

        results = []
        for model in self.RECOMMENDED_FREE_MODELS:
            if model == self.model:
                continue  # 跳过当前模型

            print(f"  测试 {model}...", end=" ")
            result = await self.test_model(model)
            results.append(result)

            if result["success"]:
                print(f"✅ 可用 ({result['response_time']}秒)")
            else:
                error_msg = result['error'][:50] if result['error'] else "未知错误"
                print(f"❌ 不可用 - {error_msg}")

            # 避免请求过快
            await asyncio.sleep(1)

        return results

    def print_summary(self):
        """打印测试总结"""
        self.print_header("测试总结")

        passed = sum(1 for r in self.results if r["success"])
        total = len(self.results)

        print(f"\n通过: {passed}/{total} 测试")

        if passed == total:
            print("\n🎉 所有测试通过！API配置正常。")
        elif passed > 0:
            print("\n⚠️ 部分测试通过，建议检查失败的配置。")
        else:
            print("\n❌ 所有测试失败，请检查API Key和网络连接。")

        # 打印推荐
        print("\n" + "-" * 60)
        print("推荐配置:")

        available_models = [
            r for r in self.results
            if "模型" in r["test"] and r["success"]
        ]

        if available_models:
            print("可用的模型:")
            for r in available_models:
                print(f"  - {r['test'].replace('模型 ', '').replace(' 可用', '')}")

        print("\n环境变量配置示例:")
        print(f"  OPENROUTER_API_KEY={self.api_key}")
        print(f"  OPENROUTER_BASE_URL={self.base_url}")
        print(f"  LLM_MODEL=<从可用模型中选择>")

    async def run_all_tests(self):
        """运行所有测试"""
        print("\n" + "=" * 60)
        print("  HeartMirror API 连接诊断工具")
        print("  诊断 OpenRouter API 配置问题")
        print("=" * 60)

        # 测试1: API Key格式
        key_valid = self.test_api_key_format()
        if not key_valid:
            self.print_summary()
            return

        # 测试2: API连接
        connection_ok = await self.test_api_connection()
        if not connection_ok:
            self.print_summary()
            return

        # 测试3: 当前模型
        current_ok = await self.test_current_model()

        # 测试4: 备用模型（仅当当前模型失败时）
        alternative_results = []
        if not current_ok:
            print("\n当前模型不可用，测试备用模型...")
            alternative_results = await self.test_alternative_models()

        # 打印总结
        self.print_summary()

        # 返回可用的模型列表
        available = [r for r in alternative_results if r["success"]]
        if available:
            print("\n推荐的可用模型（按响应速度排序）:")
            available.sort(key=lambda x: x["response_time"])
            for r in available[:3]:
                print(f"  1. {r['model']} ({r['response_time']}秒)")


async def main():
    """主函数"""
    diagnostics = APIDiagnostics()
    await diagnostics.run_all_tests()


if __name__ == "__main__":
    asyncio.run(main())
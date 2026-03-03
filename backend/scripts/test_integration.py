"""
HeartMirror 集成测试脚本
用于验证系统各组件是否正常工作
"""
import sys
import os
import asyncio
import subprocess
import time
from pathlib import Path

# 添加后端路径
sys.path.insert(0, str(Path(__file__).parent.parent))

# 设置控制台编码
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')


def print_header(title: str):
    """打印标题"""
    print("\n" + "=" * 60)
    print(f" {title}")
    print("=" * 60)


def print_result(name: str, success: bool, message: str = ""):
    """打印测试结果"""
    status = "[PASS]" if success else "[FAIL]"
    print(f"  {status} {name}")
    if message:
        print(f"         {message}")


def check_python_version():
    """检查Python版本"""
    print_header("1. Python版本检查")
    version = sys.version_info
    success = version.major >= 3 and version.minor >= 10
    print_result(
        f"Python {version.major}.{version.minor}.{version.micro}",
        success,
        "需要 Python 3.10+" if not success else ""
    )
    return success


def check_dependencies():
    """检查Python依赖"""
    print_header("2. Python依赖检查")

    required_packages = [
        ("fastapi", "FastAPI"),
        ("uvicorn", "Uvicorn"),
        ("sqlalchemy", "SQLAlchemy"),
        ("pydantic", "Pydantic"),
        ("openai", "OpenAI"),
        ("tenacity", "Tenacity"),
        ("cryptography", "Cryptography"),
        ("passlib", "Passlib"),
        ("jose", "python-jose"),
    ]

    all_success = True
    for module, name in required_packages:
        try:
            __import__(module)
            print_result(name, True)
        except ImportError:
            print_result(name, False, "未安装")
            all_success = False

    return all_success


def check_env_file():
    """检查环境变量文件"""
    print_header("3. 环境变量检查")

    env_path = Path(__file__).parent.parent / ".env"
    if not env_path.exists():
        print_result(".env文件", False, "文件不存在，请复制.env.example")
        return False

    print_result(".env文件", True)

    # 检查关键配置
    from dotenv import load_dotenv
    load_dotenv(env_path)

    configs = [
        ("OPENROUTER_API_KEY", "OpenRouter API密钥"),
        ("DATABASE_URL", "数据库URL"),
        ("JWT_SECRET_KEY", "JWT密钥"),
    ]

    all_success = True
    for key, name in configs:
        value = os.getenv(key, "")
        if value and value != f"your-{key.lower().replace('_', '-')}-change-in-production":
            print_result(name, True)
        else:
            print_result(name, False, "未配置或使用默认值")
            all_success = False

    return all_success


def check_project_structure():
    """检查项目结构"""
    print_header("4. 项目结构检查")

    backend_path = Path(__file__).parent.parent
    required_paths = [
        ("app/main.py", "主入口文件"),
        ("app/api/auth.py", "认证API"),
        ("app/api/chat.py", "对话API"),
        ("app/agents/orchestrator.py", "Agent协调器"),
        ("app/services/llm_service.py", "LLM服务"),
        ("app/core/database.py", "数据库配置"),
    ]

    all_success = True
    for rel_path, name in required_paths:
        full_path = backend_path / rel_path
        if full_path.exists():
            print_result(name, True)
        else:
            print_result(name, False, f"文件缺失: {rel_path}")
            all_success = False

    return all_success


async def test_llm_service():
    """测试LLM服务"""
    print_header("5. LLM服务测试")

    try:
        from app.services.llm_service import get_llm_service

        llm = get_llm_service()
        print_result("LLM服务初始化", True)

        # 简单测试
        try:
            response = await llm.generate(
                prompt="你好",
                system_prompt="你是一个友好的助手",
                max_tokens=20
            )
            print_result("LLM调用测试", bool(response))
            if response:
                print(f"         响应: {response[:50]}...")
        except Exception as e:
            print_result("LLM调用测试", False, str(e)[:50])
            return False

        return True
    except Exception as e:
        print_result("LLM服务", False, str(e))
        return False


async def test_database_models():
    """测试数据库模型"""
    print_header("6. 数据库模型检查")

    try:
        from app.models.user import User
        from app.models.session import ChatSession, ChatMessage
        from app.models.emotion import EmotionRecord

        print_result("User模型", True)
        print_result("ChatSession模型", True)
        print_result("ChatMessage模型", True)
        print_result("EmotionRecord模型", True)
        return True
    except Exception as e:
        print_result("模型加载", False, str(e))
        return False


async def test_agent_system():
    """测试Agent系统"""
    print_header("7. Agent系统测试")

    try:
        from app.agents.orchestrator import AgentOrchestrator
        from app.agents.risk_agent import RiskAgent
        from app.agents.intervention_agent import InterventionAgent

        print_result("Agent模块导入", True)

        # 测试Orchestrator
        orchestrator = AgentOrchestrator()
        print_result("Orchestrator初始化", True)

        # 测试Agent实例
        agents_ok = all([
            "emotion" in orchestrator.agents,
            "questionnaire" in orchestrator.agents,
            "risk" in orchestrator.agents,
            "intervention" in orchestrator.agents,
        ])
        print_result("Agent注册", agents_ok)

        # 检查torch是否可用（用于BERT情绪识别）
        try:
            import torch
            print_result("Torch/BERT环境", True)
        except ImportError:
            print_result("Torch/BERT环境", False, "未安装，情绪识别将使用LLM降级模式")
            print("         提示: pip install torch transformers 启用完整情绪识别功能")

        return True
    except Exception as e:
        print_result("Agent系统", False, str(e))
        return False


def check_frontend():
    """检查前端配置"""
    print_header("8. 前端配置检查")

    frontend_path = Path(__file__).parent.parent.parent / "frontend"
    if not frontend_path.exists():
        print_result("frontend目录", False, "目录不存在")
        return False

    print_result("frontend目录", True)

    # 检查package.json
    package_json = frontend_path / "package.json"
    if package_json.exists():
        print_result("package.json", True)
    else:
        print_result("package.json", False)
        return False

    # 检查node_modules
    node_modules = frontend_path / "node_modules"
    if node_modules.exists():
        print_result("node_modules", True, "依赖已安装")
    else:
        print_result("node_modules", False, "请运行 npm install")
        return False

    return True


def print_summary(results: dict):
    """打印测试摘要"""
    print_header("测试摘要")

    total = len(results)
    passed = sum(1 for v in results.values() if v)
    failed = total - passed

    print(f"\n  总计: {total} 项测试")
    print(f"  通过: {passed} 项")
    print(f"  失败: {failed} 项")

    if failed > 0:
        print("\n  失败项目:")
        for name, success in results.items():
            if not success:
                print(f"    - {name}")

    print("\n" + "=" * 60)

    if failed == 0:
        print(" 所有检查通过！系统已准备就绪。")
    else:
        print(" 存在未通过的检查，请修复后再启动服务。")
    print("=" * 60 + "\n")


async def main():
    """主测试流程"""
    print("\n" + "=" * 60)
    print(" HeartMirror 系统集成测试")
    print(" " + time.strftime("%Y-%m-%d %H:%M:%S"))
    print("=" * 60)

    results = {}

    # 同步测试
    results["Python版本"] = check_python_version()
    results["Python依赖"] = check_dependencies()
    results["环境变量"] = check_env_file()
    results["项目结构"] = check_project_structure()

    # 异步测试
    results["LLM服务"] = await test_llm_service()
    results["数据库模型"] = await test_database_models()
    results["Agent系统"] = await test_agent_system()

    # 前端测试
    results["前端配置"] = check_frontend()

    # 打印摘要
    print_summary(results)

    return all(results.values())


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
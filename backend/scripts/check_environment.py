#!/usr/bin/env python3
"""
HeartMirror Environment Check Script
环境校验脚本

功能：
1. Python版本检查（要求3.10+）
2. 依赖包版本验证
3. 关键功能测试（导入测试）
4. 环境变量验证
"""

import sys
import os
from typing import Dict, List, Tuple
from dataclasses import dataclass


@dataclass
class CheckResult:
    """检查结果"""
    name: str
    status: str  # OK, ERROR, WARNING
    message: str
    version: str = ""


class EnvironmentChecker:
    """环境检查器"""

    def __init__(self):
        self.results: List[CheckResult] = []

    def print_header(self):
        """打印标题"""
        print("\n" + "=" * 60)
        print("  HeartMirror 环境校验脚本")
        print("=" * 60 + "\n")

    def print_result(self, result: CheckResult):
        """打印结果"""
        status_icon = {
            "OK": "✓",
            "ERROR": "✗",
            "WARNING": "⚠"
        }
        icon = status_icon.get(result.status, "?")
        color = {
            "OK": "\033[92m",    # 绿色
            "ERROR": "\033[91m",  # 红色
            "WARNING": "\033[93m" # 黄色
        }
        reset = "\033[0m"

        msg = f"{color.get(result.status, '')}{icon}{reset} [{result.status}] {result.name}"
        if result.version:
            msg += f" (v{result.version})"
        print(msg)

        if result.message and result.status != "OK":
            print(f"    └─ {result.message}")

    def check_python_version(self) -> CheckResult:
        """检查Python版本"""
        version = sys.version_info
        version_str = f"{version.major}.{version.minor}.{version.micro}"

        if version.major >= 3 and version.minor >= 10:
            return CheckResult(
                name="Python版本",
                status="OK",
                message="",
                version=version_str
            )
        else:
            return CheckResult(
                name="Python版本",
                status="ERROR",
                message=f"需要Python 3.10+，当前为{version_str}",
                version=version_str
            )

    def check_package(self, package_name: str, import_name: str = None) -> CheckResult:
        """检查单个包"""
        import_name = import_name or package_name

        try:
            module = __import__(import_name)
            version = getattr(module, "__version__", "unknown")
            return CheckResult(
                name=package_name,
                status="OK",
                message="",
                version=version
            )
        except ImportError:
            return CheckResult(
                name=package_name,
                status="ERROR",
                message=f"未安装，请运行: pip install {package_name}",
                version=""
            )
        except Exception as e:
            return CheckResult(
                name=package_name,
                status="WARNING",
                message=str(e),
                version=""
            )

    def check_packages(self) -> List[CheckResult]:
        """检查所有关键依赖包"""
        packages = [
            # LangChain全家桶
            ("langchain", "langchain"),
            ("langchain-community", "langchain_community"),
            ("langchain-core", "langchain_core"),

            # 向量数据库
            ("chromadb", "chromadb"),

            # 模型相关
            ("transformers", "transformers"),
            ("torch", "torch"),
            ("sentence-transformers", "sentence_transformers"),

            # 数据处理
            ("pandas", "pandas"),
            ("numpy", "numpy"),
            ("scikit-learn", "sklearn"),

            # 后端框架
            ("fastapi", "fastapi"),
            ("uvicorn", "uvicorn"),

            # 数据库
            ("sqlalchemy", "sqlalchemy"),
            ("neo4j", "neo4j"),
            ("redis", "redis"),

            # 加密安全
            ("cryptography", "cryptography"),
            ("passlib", "passlib"),

            # 验证
            ("pydantic", "pydantic"),

            # 可视化
            ("plotly", "plotly"),
            ("matplotlib", "matplotlib"),

            # 测试
            ("pytest", "pytest"),
        ]

        results = []
        for package_name, import_name in packages:
            results.append(self.check_package(package_name, import_name))

        return results

    def check_import_functionality(self) -> List[CheckResult]:
        """检查关键功能导入"""
        results = []

        # 检查BERT模型相关
        try:
            from transformers import BertTokenizer, BertForSequenceClassification
            results.append(CheckResult(
                name="BERT模型导入",
                status="OK",
                message=""
            ))
        except Exception as e:
            results.append(CheckResult(
                name="BERT模型导入",
                status="ERROR",
                message=str(e)
            ))

        # 检查FastAPI
        try:
            from fastapi import FastAPI
            results.append(CheckResult(
                name="FastAPI导入",
                status="OK",
                message=""
            ))
        except Exception as e:
            results.append(CheckResult(
                name="FastAPI导入",
                status="ERROR",
                message=str(e)
            ))

        # 检查SQLAlchemy
        try:
            from sqlalchemy.ext.asyncio import AsyncSession
            results.append(CheckResult(
                name="SQLAlchemy异步导入",
                status="OK",
                message=""
            ))
        except Exception as e:
            results.append(CheckResult(
                name="SQLAlchemy异步导入",
                status="ERROR",
                message=str(e)
            ))

        # 检查LangChain
        try:
            from langchain_core.prompts import ChatPromptTemplate
            results.append(CheckResult(
                name="LangChain导入",
                status="OK",
                message=""
            ))
        except Exception as e:
            results.append(CheckResult(
                name="LangChain导入",
                status="ERROR",
                message=str(e)
            ))

        return results

    def check_env_file(self) -> CheckResult:
        """检查环境变量文件"""
        env_path = ".env"
        env_example_path = ".env.example"

        if os.path.exists(env_path):
            return CheckResult(
                name=".env配置文件",
                status="OK",
                message="配置文件已存在"
            )
        elif os.path.exists(env_example_path):
            return CheckResult(
                name=".env配置文件",
                status="WARNING",
                message="请复制.env.example为.env并配置"
            )
        else:
            return CheckResult(
                name=".env配置文件",
                status="WARNING",
                message="未找到配置文件"
            )

    def run(self):
        """运行所有检查"""
        self.print_header()

        print("【Python环境】")
        result = self.check_python_version()
        self.print_result(result)
        print()

        print("【核心依赖包】")
        for result in self.check_packages():
            self.print_result(result)
        print()

        print("【功能导入测试】")
        for result in self.check_import_functionality():
            self.print_result(result)
        print()

        print("【配置文件】")
        result = self.check_env_file()
        self.print_result(result)
        print()

        # 统计结果
        errors = sum(1 for r in self.results if r.status == "ERROR")
        warnings = sum(1 for r in self.results if r.status == "WARNING")

        print("=" * 60)
        if errors == 0:
            print("✓ 环境检查通过！")
            print("\n启动服务: uvicorn app.main:app --reload")
        else:
            print(f"✗ 发现 {errors} 个错误，请先修复")
        print("=" * 60 + "\n")


def main():
    checker = EnvironmentChecker()
    checker.run()


if __name__ == "__main__":
    main()
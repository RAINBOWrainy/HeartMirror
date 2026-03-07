#!/usr/bin/env python3
"""
Initialize Database
数据库初始化脚本
"""
import asyncio
import sys
import os

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import db_manager, Base, init_database


async def create_tables():
    """创建所有数据表"""
    print("正在创建数据表...")

    # 导入所有模型以确保它们被注册
    from app.models import user, emotion, questionnaire, intervention, session

    await init_database()

    print("数据表创建完成！")


async def main():
    """主函数"""
    print("=" * 50)
    print("HeartMirror 数据库初始化")
    print("=" * 50)

    await create_tables()

    print("=" * 50)
    print("数据库初始化完成！")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(main())
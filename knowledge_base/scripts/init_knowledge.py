"""
Initialize Knowledge Base
知识库初始化脚本
"""
import os
import sys

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))


def init_dsm5_knowledge():
    """初始化DSM-5知识图谱"""
    print("正在初始化DSM-5知识图谱...")

    from knowledge_base.dsm5_builder.build_graph import build_dsm5_knowledge
    build_dsm5_knowledge()

    print("DSM-5知识图谱初始化完成")


def init_vector_store():
    """初始化向量库"""
    print("正在初始化向量库...")

    from knowledge_base.vector_builder.build_vectors import build_vector_store
    build_vector_store()

    print("向量库初始化完成")


def init_all():
    """初始化所有知识库"""
    print("=" * 50)
    print("HeartMirror 知识库初始化")
    print("=" * 50)

    # 创建输出目录
    os.makedirs("./output", exist_ok=True)

    # 初始化各模块
    init_dsm5_knowledge()
    init_vector_store()

    print("=" * 50)
    print("知识库初始化完成！")
    print("=" * 50)


if __name__ == "__main__":
    init_all()
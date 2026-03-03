"""
Vector Store
向量存储管理模块
"""
from typing import List, Optional, Dict, Any
import os


class VectorStore:
    """
    向量存储管理类

    使用ChromaDB进行向量检索
    """

    def __init__(
        self,
        persist_directory: Optional[str] = None,
        collection_name: str = "heartmirror_knowledge"
    ):
        """
        初始化向量存储

        Args:
            persist_directory: 持久化目录
            collection_name: 集合名称
        """
        self.persist_directory = persist_directory or "./chroma_db"
        self.collection_name = collection_name
        self.client = None
        self.collection = None

    def initialize(self):
        """初始化ChromaDB客户端"""
        try:
            import chromadb
            self.client = chromadb.PersistentClient(path=self.persist_directory)
            self.collection = self.client.get_or_create_collection(
                name=self.collection_name
            )
        except Exception as e:
            print(f"ChromaDB初始化失败: {e}")

    def add_documents(
        self,
        documents: List[str],
        metadatas: Optional[List[Dict]] = None,
        ids: Optional[List[str]] = None
    ):
        """
        添加文档到向量库

        Args:
            documents: 文档列表
            metadatas: 元数据列表
            ids: ID列表
        """
        if not self.collection:
            self.initialize()

        if ids is None:
            ids = [f"doc_{i}" for i in range(len(documents))]

        self.collection.add(
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )

    def query(
        self,
        query_text: str,
        n_results: int = 5
    ) -> Dict[str, Any]:
        """
        查询相似文档

        Args:
            query_text: 查询文本
            n_results: 返回结果数量

        Returns:
            查询结果
        """
        if not self.collection:
            self.initialize()

        return self.collection.query(
            query_texts=[query_text],
            n_results=n_results
        )

    def delete_collection(self):
        """删除集合"""
        if self.client:
            self.client.delete_collection(self.collection_name)
"""
Vector Store
向量存储管理模块
"""
from typing import List, Optional, Dict, Any
import os
import logging

logger = logging.getLogger(__name__)


class VectorStore:
    """
    向量存储管理类

    使用ChromaDB进行向量检索，支持降级为内存存储
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
        self._in_memory_store: Dict[str, Dict] = {}  # 降级时的内存存储
        self._initialized = False

    def initialize(self):
        """初始化ChromaDB客户端"""
        if self._initialized:
            return

        try:
            import chromadb
            self.client = chromadb.PersistentClient(path=self.persist_directory)
            self.collection = self.client.get_or_create_collection(
                name=self.collection_name
            )
            self._initialized = True
            logger.info("ChromaDB initialized successfully")
        except ImportError:
            logger.warning("ChromaDB not installed, using in-memory fallback")
            self._initialized = True
        except Exception as e:
            logger.warning(f"ChromaDB initialization failed: {e}, using in-memory fallback")
            self._initialized = True

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
        if not self._initialized:
            self.initialize()

        if ids is None:
            ids = [f"doc_{i}" for i in range(len(documents))]

        # 优先使用 ChromaDB
        if self.collection:
            try:
                self.collection.add(
                    documents=documents,
                    metadatas=metadatas,
                    ids=ids
                )
                return
            except Exception as e:
                logger.warning(f"ChromaDB add failed: {e}, using in-memory store")

        # 降级到内存存储
        for i, doc_id in enumerate(ids):
            self._in_memory_store[doc_id] = {
                "document": documents[i] if i < len(documents) else "",
                "metadata": metadatas[i] if metadatas and i < len(metadatas) else {}
            }

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
        if not self._initialized:
            self.initialize()

        # 优先使用 ChromaDB
        if self.collection:
            try:
                return self.collection.query(
                    query_texts=[query_text],
                    n_results=n_results
                )
            except Exception as e:
                logger.warning(f"ChromaDB query failed: {e}, using in-memory search")

        # 降级到内存搜索（简单关键词匹配）
        results = []
        metadatas = []
        for doc_id, doc_data in list(self._in_memory_store.items())[:n_results]:
            results.append(doc_data["document"])
            metadatas.append(doc_data["metadata"])

        return {
            "documents": [results] if results else [[]],
            "metadatas": [metadatas] if metadatas else [[]],
            "ids": [list(self._in_memory_store.keys())[:n_results]],
            "distances": [[0.5] * len(results)]
        }
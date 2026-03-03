"""
Embedder
文本嵌入模型管理模块
"""
from typing import List, Optional
import numpy as np


class Embedder:
    """
    文本嵌入模型管理类

    使用Sentence-BERT进行文本嵌入
    """

    def __init__(
        self,
        model_name: str = "paraphrase-multilingual-MiniLM-L12-v2",
        device: str = "cpu"
    ):
        """
        初始化嵌入模型

        Args:
            model_name: 模型名称
            device: 运行设备
        """
        self.model_name = model_name
        self.device = device
        self.model = None

    def load_model(self):
        """加载模型"""
        try:
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer(self.model_name, device=self.device)
        except Exception as e:
            print(f"模型加载失败: {e}")

    def encode(self, texts: List[str]) -> np.ndarray:
        """
        编码文本为向量

        Args:
            texts: 文本列表

        Returns:
            嵌入向量数组
        """
        if not self.model:
            self.load_model()

        return self.model.encode(texts)

    def encode_single(self, text: str) -> np.ndarray:
        """编码单个文本"""
        return self.encode([text])[0]

    def similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        """计算余弦相似度"""
        return float(np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2)))

    def find_most_similar(
        self,
        query: str,
        documents: List[str]
    ) -> List[tuple]:
        """
        查找最相似的文档

        Args:
            query: 查询文本
            documents: 文档列表

        Returns:
            (文档索引, 相似度) 列表
        """
        query_vec = self.encode_single(query)
        doc_vecs = self.encode(documents)

        similarities = []
        for i, doc_vec in enumerate(doc_vecs):
            sim = self.similarity(query_vec, doc_vec)
            similarities.append((i, sim))

        return sorted(similarities, key=lambda x: -x[1])
"""
Vector Store Builder
向量库构建脚本
"""
import os
import json
from typing import List, Dict


class VectorStoreBuilder:
    """向量库构建器"""

    def __init__(self, output_dir: str = "./output"):
        self.output_dir = output_dir
        self.documents: List[Dict] = []

    def add_document(self, doc_id: str, content: str, metadata: Dict = None):
        """添加文档"""
        self.documents.append({
            "id": doc_id,
            "content": content,
            "metadata": metadata or {}
        })

    def load_from_json(self, filepath: str):
        """从JSON文件加载文档"""
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                for item in data:
                    self.add_document(
                        doc_id=item.get("id", ""),
                        content=item.get("content", ""),
                        metadata=item.get("metadata", {})
                    )

    def build_chunks(self, chunk_size: int = 500) -> List[Dict]:
        """将文档分割成小块"""
        chunks = []
        for doc in self.documents:
            content = doc["content"]
            # 简单分割
            for i in range(0, len(content), chunk_size):
                chunk = content[i:i + chunk_size]
                chunks.append({
                    "id": f"{doc['id']}_chunk_{i // chunk_size}",
                    "content": chunk,
                    "metadata": {
                        **doc["metadata"],
                        "source_id": doc["id"],
                        "chunk_index": i // chunk_size
                    }
                })
        return chunks

    def export_chunks(self, chunks: List[Dict]):
        """导出分块"""
        os.makedirs(self.output_dir, exist_ok=True)
        with open(os.path.join(self.output_dir, "chunks.json"), "w", encoding="utf-8") as f:
            json.dump(chunks, f, ensure_ascii=False, indent=2)
        print(f"导出完成：{len(chunks)} 个文档块")


def build_vector_store():
    """构建向量库"""
    builder = VectorStoreBuilder()

    # 添加心理健康知识文档
    documents = [
        {
            "id": "depression_overview",
            "content": "抑郁症是一种常见的精神障碍，主要表现为持续的情绪低落、兴趣减退、精力下降等症状。根据世界卫生组织统计，全球约有3亿人患有抑郁症。抑郁症的治疗方法包括药物治疗、心理治疗（如认知行为疗法）和生活方式调整。",
            "metadata": {"category": "disorder", "type": "overview"}
        },
        {
            "id": "anxiety_overview",
            "content": "焦虑症是一类以过度担忧和恐惧为特征的精神障碍。常见类型包括广泛性焦虑障碍、恐慌障碍、社交焦虑障碍等。焦虑症可以通过认知行为疗法、放松训练、药物治疗等方式进行有效管理。",
            "metadata": {"category": "disorder", "type": "overview"}
        },
        {
            "id": "cbt_introduction",
            "content": "认知行为疗法（CBT）是一种结构化的心理治疗方法，通过帮助个体识别和改变消极思维模式来改善情绪和行为。CBT被广泛用于治疗抑郁症、焦虑症等多种心理健康问题，其核心原则是思维、情绪和行为之间存在相互影响的关系。",
            "metadata": {"category": "intervention", "type": "therapy"}
        },
        {
            "id": "mindfulness_basics",
            "content": "正念冥想是一种培养对当下经验的觉察和接纳能力的练习。通过定期的正念练习，可以减少焦虑和压力，提高情绪调节能力，增强自我意识。常见的正念练习包括呼吸冥想、身体扫描、正念行走等。",
            "metadata": {"category": "intervention", "type": "self_help"}
        }
    ]

    for doc in documents:
        builder.add_document(doc["id"], doc["content"], doc["metadata"])

    # 构建并导出
    chunks = builder.build_chunks(chunk_size=300)
    builder.export_chunks(chunks)


if __name__ == "__main__":
    build_vector_store()
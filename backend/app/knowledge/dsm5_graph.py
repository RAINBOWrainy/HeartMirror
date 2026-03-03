"""
DSM-5 Knowledge Graph
DSM-5知识图谱管理模块
"""
from typing import Dict, List, Optional
import json


class DSM5KnowledgeGraph:
    """
    DSM-5知识图谱管理类

    管理心理健康诊断标准的知识图谱
    """

    def __init__(self, neo4j_uri: Optional[str] = None):
        """
        初始化知识图谱

        Args:
            neo4j_uri: Neo4j数据库URI
        """
        self.neo4j_uri = neo4j_uri
        self.driver = None
        self._local_knowledge = self._load_local_knowledge()

    def _load_local_knowledge(self) -> Dict:
        """加载本地知识库"""
        # 本地知识库（简化版本）
        return {
            "disorders": {
                "depression": {
                    "name": "抑郁症",
                    "dsm5_code": "F32.x",
                    "symptoms": [
                        "情绪低落",
                        "兴趣减退",
                        "精力下降",
                        "睡眠障碍",
                        "食欲改变",
                        "自我评价低",
                        "注意力下降",
                        "消极想法"
                    ],
                    "criteria": "至少持续2周，且影响日常功能"
                },
                "anxiety": {
                    "name": "焦虑症",
                    "dsm5_code": "F41.x",
                    "symptoms": [
                        "过度担忧",
                        "紧张不安",
                        "心悸",
                        "出汗",
                        "颤抖",
                        "坐立不安",
                        "睡眠困难"
                    ],
                    "criteria": "症状持续6个月以上"
                },
                "panic_disorder": {
                    "name": "惊恐障碍",
                    "dsm5_code": "F41.0",
                    "symptoms": [
                        "突然的强烈恐惧",
                        "心悸或心率加快",
                        "出汗",
                        "颤抖",
                        "呼吸困难",
                        "胸痛",
                        "恶心",
                        "头晕"
                    ],
                    "criteria": "反复发作，伴随对未来发作的担忧"
                }
            },
            "symptoms": {
                "情绪低落": {"related_disorders": ["depression"]},
                "焦虑": {"related_disorders": ["anxiety", "panic_disorder"]},
                "失眠": {"related_disorders": ["depression", "anxiety"]},
                "心悸": {"related_disorders": ["anxiety", "panic_disorder"]}
            },
            "interventions": {
                "depression": ["CBT", "运动疗法", "社交活动", "正念冥想"],
                "anxiety": ["呼吸训练", "正念冥想", "渐进性肌肉放松", "CBT"],
                "panic_disorder": ["呼吸训练", "暴露疗法", "CBT"]
            }
        }

    async def connect(self):
        """连接到Neo4j数据库"""
        if self.neo4j_uri:
            try:
                from neo4j import GraphDatabase
                self.driver = GraphDatabase.driver(
                    self.neo4j_uri,
                    auth=("neo4j", "password")
                )
            except Exception as e:
                print(f"Neo4j连接失败: {e}")

    async def close(self):
        """关闭连接"""
        if self.driver:
            self.driver.close()

    def query_disorder(self, disorder_name: str) -> Optional[Dict]:
        """查询疾病信息"""
        return self._local_knowledge["disorders"].get(disorder_name)

    def query_symptom(self, symptom: str) -> Optional[Dict]:
        """查询症状相关疾病"""
        return self._local_knowledge["symptoms"].get(symptom)

    def get_interventions(self, disorder_name: str) -> List[str]:
        """获取推荐的干预方案"""
        return self._local_knowledge["interventions"].get(disorder_name, [])

    def match_symptoms_to_disorder(self, symptoms: List[str]) -> List[Dict]:
        """
        根据症状匹配可能的疾病

        Args:
            symptoms: 症状列表

        Returns:
            可能的疾病列表
        """
        results = []
        disorder_scores: Dict[str, int] = {}

        for symptom in symptoms:
            symptom_info = self._local_knowledge["symptoms"].get(symptom)
            if symptom_info:
                for disorder in symptom_info.get("related_disorders", []):
                    disorder_scores[disorder] = disorder_scores.get(disorder, 0) + 1

        # 排序并返回结果
        for disorder, score in sorted(disorder_scores.items(), key=lambda x: -x[1]):
            disorder_info = self._local_knowledge["disorders"].get(disorder)
            if disorder_info:
                results.append({
                    "disorder": disorder,
                    "name": disorder_info["name"],
                    "match_score": score,
                    "matched_symptoms": score
                })

        return results
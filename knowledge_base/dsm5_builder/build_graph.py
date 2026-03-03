"""
DSM-5 Knowledge Graph Builder
DSM-5知识图谱构建脚本
"""
import json
from typing import Dict, List
import os


class DSM5GraphBuilder:
    """DSM-5知识图谱构建器"""

    def __init__(self, output_dir: str = "./output"):
        self.output_dir = output_dir
        self.nodes: List[Dict] = []
        self.relationships: List[Dict] = []

    def build_disorder_nodes(self, disorders: Dict):
        """构建疾病节点"""
        for disorder_key, disorder_info in disorders.items():
            node = {
                "id": disorder_key,
                "type": "Disorder",
                "properties": {
                    "name": disorder_info.get("name", ""),
                    "code": disorder_info.get("code", ""),
                    "description": disorder_info.get("description", "")
                }
            }
            self.nodes.append(node)

    def build_symptom_nodes(self, symptoms: Dict):
        """构建症状节点"""
        for symptom_key, symptom_info in symptoms.items():
            node = {
                "id": symptom_key,
                "type": "Symptom",
                "properties": {
                    "name": symptom_key,
                    "description": symptom_info.get("description", "")
                }
            }
            self.nodes.append(node)

            # 创建症状-疾病关系
            for disorder in symptom_info.get("related_disorders", []):
                self.relationships.append({
                    "source": symptom_key,
                    "target": disorder,
                    "type": "INDICATES"
                })

    def build_intervention_nodes(self, interventions: Dict):
        """构建干预方案节点"""
        for int_key, int_info in interventions.items():
            node = {
                "id": int_key,
                "type": "Intervention",
                "properties": {
                    "name": int_info.get("name", ""),
                    "type": int_info.get("type", ""),
                    "duration": int_info.get("duration", "")
                }
            }
            self.nodes.append(node)

            # 创建干预-疾病关系
            for disorder in int_info.get("suitable_for", []):
                self.relationships.append({
                    "source": int_key,
                    "target": disorder,
                    "type": "TREATS"
                })

    def export_to_json(self):
        """导出为JSON文件"""
        os.makedirs(self.output_dir, exist_ok=True)

        # 导出节点
        with open(os.path.join(self.output_dir, "nodes.json"), "w", encoding="utf-8") as f:
            json.dump(self.nodes, f, ensure_ascii=False, indent=2)

        # 导出关系
        with open(os.path.join(self.output_dir, "relationships.json"), "w", encoding="utf-8") as f:
            json.dump(self.relationships, f, ensure_ascii=False, indent=2)

        print(f"导出完成：{len(self.nodes)} 个节点，{len(self.relationships)} 个关系")


def build_dsm5_knowledge():
    """构建DSM-5知识图谱"""
    builder = DSM5GraphBuilder()

    # 定义知识数据
    disorders = {
        "depression": {
            "name": "抑郁症",
            "code": "F32",
            "description": "持续的情绪低落和兴趣减退"
        },
        "anxiety": {
            "name": "广泛性焦虑障碍",
            "code": "F41.1",
            "description": "过度的担忧和焦虑"
        },
        "panic_disorder": {
            "name": "惊恐障碍",
            "code": "F41.0",
            "description": "反复的惊恐发作"
        }
    }

    symptoms = {
        "情绪低落": {
            "description": "持续感到悲伤、空虚",
            "related_disorders": ["depression"]
        },
        "兴趣减退": {
            "description": "对以往感兴趣的活动失去兴趣",
            "related_disorders": ["depression"]
        },
        "过度担忧": {
            "description": "对多种事物过度担心",
            "related_disorders": ["anxiety"]
        },
        "心悸": {
            "description": "心跳加速或不规律",
            "related_disorders": ["anxiety", "panic_disorder"]
        }
    }

    interventions = {
        "cbt": {
            "name": "认知行为疗法",
            "type": "心理治疗",
            "duration": "12-20次",
            "suitable_for": ["depression", "anxiety"]
        },
        "mindfulness": {
            "name": "正念冥想",
            "type": "自助练习",
            "duration": "每日10-30分钟",
            "suitable_for": ["anxiety", "depression"]
        },
        "breathing": {
            "name": "呼吸训练",
            "type": "自助练习",
            "duration": "5-15分钟",
            "suitable_for": ["anxiety", "panic_disorder"]
        }
    }

    # 构建图谱
    builder.build_disorder_nodes(disorders)
    builder.build_symptom_nodes(symptoms)
    builder.build_intervention_nodes(interventions)

    # 导出
    builder.export_to_json()


if __name__ == "__main__":
    build_dsm5_knowledge()
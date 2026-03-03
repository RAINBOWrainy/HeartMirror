"""
Questionnaire Agent RAG Engine
RAG检索增强生成引擎
"""
from typing import List, Optional, Dict, Any
from langchain_core.documents import Document
import os

from app.knowledge.vector_store import VectorStore
from app.knowledge.embedder import Embedder
from app.knowledge.dsm5_graph import DSM5KnowledgeGraph


class RAGEngine:
    """
    RAG检索引擎

    结合向量检索和知识图谱，为问卷生成提供上下文支持
    """

    def __init__(
        self,
        vector_store: Optional[VectorStore] = None,
        embedder: Optional[Embedder] = None,
        knowledge_graph: Optional[DSM5KnowledgeGraph] = None,
        persist_directory: Optional[str] = None
    ):
        """
        初始化RAG引擎

        Args:
            vector_store: 向量存储实例
            embedder: 嵌入模型实例
            knowledge_graph: 知识图谱实例
            persist_directory: 向量库持久化目录
        """
        self.persist_directory = persist_directory or "./chroma_db"

        # 初始化向量存储
        if vector_store:
            self.vector_store = vector_store
        else:
            self.vector_store = VectorStore(persist_directory=self.persist_directory)
            self.vector_store.initialize()

        # 初始化嵌入模型
        if embedder:
            self.embedder = embedder
        else:
            self.embedder = Embedder()

        # 初始化知识图谱
        if knowledge_graph:
            self.knowledge_graph = knowledge_graph
        else:
            self.knowledge_graph = DSM5KnowledgeGraph()

        # 问卷相关知识文档
        self._questionnaire_knowledge = self._init_questionnaire_knowledge()

    def _init_questionnaire_knowledge(self) -> Dict[str, Any]:
        """初始化问卷相关知识"""
        return {
            "assessment_areas": [
                {
                    "id": "mood",
                    "name": "情绪状态",
                    "description": "评估用户的整体情绪状态和情感体验",
                    "sample_questions": [
                        "最近一周您的整体心情如何？",
                        "您是否经常感到情绪低落或沮丧？",
                        "有什么事情让您感到开心吗？"
                    ]
                },
                {
                    "id": "anxiety",
                    "name": "焦虑程度",
                    "description": "评估焦虑相关症状和体验",
                    "sample_questions": [
                        "您最近是否经常感到紧张或不安？",
                        "是否有一些事情让您特别担心？",
                        "在什么情况下您会感到焦虑？"
                    ]
                },
                {
                    "id": "sleep",
                    "name": "睡眠质量",
                    "description": "评估睡眠模式和睡眠质量",
                    "sample_questions": [
                        "您最近的睡眠质量如何？",
                        "是否经常失眠或早醒？",
                        "每天大约能睡多少小时？"
                    ]
                },
                {
                    "id": "energy",
                    "name": "精力水平",
                    "description": "评估日常精力和工作效率",
                    "sample_questions": [
                        "您最近的精力如何？",
                        "是否经常感到疲劳或乏力？",
                        "日常活动中能保持专注吗？"
                    ]
                },
                {
                    "id": "social",
                    "name": "社交功能",
                    "description": "评估社交活动和人际关系",
                    "sample_questions": [
                        "您最近是否愿意与他人交往？",
                        "和家人朋友的关系如何？",
                        "是否感到孤独或被孤立？"
                    ]
                },
                {
                    "id": "appetite",
                    "name": "食欲变化",
                    "description": "评估饮食习惯和食欲变化",
                    "sample_questions": [
                        "您最近的食欲有变化吗？",
                        "体重是否有明显波动？",
                        "是否暴饮暴食或食欲不振？"
                    ]
                }
            ],
            "standard_scales": {
                "PHQ-9": {
                    "name": "患者健康问卷-9",
                    "purpose": "抑郁症筛查",
                    "questions": [
                        "做事时提不起劲或没有兴趣",
                        "感到心情低落、沮丧或绝望",
                        "入睡困难、易醒或睡眠过多",
                        "感觉疲倦或没有活力",
                        "食欲不振或吃得太多",
                        "觉得自己很糟糕，或觉得自己很失败",
                        "对事物专注有困难",
                        "动作或说话速度缓慢，或相反",
                        "有不如死掉或伤害自己的念头"
                    ]
                },
                "GAD-7": {
                    "name": "广泛性焦虑量表-7",
                    "purpose": "焦虑症筛查",
                    "questions": [
                        "感到紧张、焦虑或急切",
                        "不能停止或控制担忧",
                        "对各种事情过分担忧",
                        "很难放松",
                        "由于不安而无法静坐",
                        "变得容易烦恼或急躁",
                        "感到似乎将有可怕的事情发生"
                    ]
                }
            },
            "risk_indicators": [
                "自杀念头",
                "自伤行为",
                "严重失眠",
                "极度绝望感",
                "社会退缩",
                "严重食欲改变"
            ]
        }

    async def initialize_knowledge_base(self):
        """初始化知识库，将知识文档添加到向量存储"""
        documents = []
        metadatas = []
        ids = []

        # 添加评估领域知识
        for area in self._questionnaire_knowledge["assessment_areas"]:
            doc_text = f"评估领域：{area['name']}\n描述：{area['description']}\n示例问题：{', '.join(area['sample_questions'])}"
            documents.append(doc_text)
            metadatas.append({"type": "assessment_area", "id": area["id"]})
            ids.append(f"area_{area['id']}")

        # 添加标准量表知识
        for scale_id, scale in self._questionnaire_knowledge["standard_scales"].items():
            doc_text = f"量表：{scale['name']}\n用途：{scale['purpose']}\n问题：{', '.join(scale['questions'])}"
            documents.append(doc_text)
            metadatas.append({"type": "standard_scale", "id": scale_id})
            ids.append(f"scale_{scale_id}")

        # 添加DSM-5知识
        for disorder_id, disorder in self.knowledge_graph._local_knowledge["disorders"].items():
            doc_text = f"疾病：{disorder['name']}\n代码：{disorder['dsm5_code']}\n症状：{', '.join(disorder['symptoms'])}\n诊断标准：{disorder['criteria']}"
            documents.append(doc_text)
            metadatas.append({"type": "dsm5_disorder", "id": disorder_id})
            ids.append(f"disorder_{disorder_id}")

        # 添加到向量存储
        if documents:
            self.vector_store.add_documents(
                documents=documents,
                metadatas=metadatas,
                ids=ids
            )

    async def retrieve(self, query: str, k: int = 5) -> List[Document]:
        """
        检索相关文档

        Args:
            query: 查询文本
            k: 返回结果数量

        Returns:
            相关文档列表
        """
        try:
            # 使用向量存储进行检索
            results = self.vector_store.query(query_text=query, n_results=k)

            documents = []
            if results and results.get("documents"):
                for i, doc_text in enumerate(results["documents"][0]):
                    metadata = {}
                    if results.get("metadatas") and results["metadatas"][0]:
                        metadata = results["metadatas"][0][i] if i < len(results["metadatas"][0]) else {}

                    documents.append(Document(
                        page_content=doc_text,
                        metadata=metadata
                    ))

            return documents

        except Exception as e:
            print(f"检索失败: {e}")
            return []

    async def retrieve_by_symptoms(self, symptoms: List[str]) -> List[Document]:
        """
        根据症状检索相关文档

        Args:
            symptoms: 症状列表

        Returns:
            相关文档列表
        """
        # 构建症状查询
        query = " ".join(symptoms)

        # 使用知识图谱匹配疾病
        matched_disorders = self.knowledge_graph.match_symptoms_to_disorder(symptoms)

        # 检索相关文档
        documents = await self.retrieve(query, k=3)

        # 添加匹配的疾病信息
        for match in matched_disorders[:2]:
            disorder_info = self.knowledge_graph.query_disorder(match["disorder"])
            if disorder_info:
                documents.append(Document(
                    page_content=f"可能的诊断：{disorder_info['name']}\n症状：{', '.join(disorder_info['symptoms'])}",
                    metadata={"type": "matched_disorder", "match_score": match["match_score"]}
                ))

        return documents

    async def generate_context(
        self,
        query: str,
        conversation_history: Optional[List[Dict]] = None,
        detected_symptoms: Optional[List[str]] = None
    ) -> str:
        """
        生成RAG上下文

        Args:
            query: 用户输入或查询
            conversation_history: 对话历史
            detected_symptoms: 已检测到的症状

        Returns:
            构建的上下文字符串
        """
        context_parts = []

        # 1. 检索相关知识文档
        documents = await self.retrieve(query, k=3)
        if documents:
            context_parts.append("【相关知识】")
            for i, doc in enumerate(documents[:3], 1):
                context_parts.append(f"{i}. {doc.page_content[:200]}")

        # 2. 如果有检测到的症状，添加症状匹配信息
        if detected_symptoms:
            matched = self.knowledge_graph.match_symptoms_to_disorder(detected_symptoms)
            if matched:
                context_parts.append("\n【症状匹配】")
                for match in matched[:2]:
                    context_parts.append(f"- {match['name']} (匹配度: {match['match_score']})")

        # 3. 获取推荐的干预方案
        if detected_symptoms:
            matched_disorders = [m["disorder"] for m in self.knowledge_graph.match_symptoms_to_disorder(detected_symptoms)]
            for disorder in matched_disorders[:1]:
                interventions = self.knowledge_graph.get_interventions(disorder)
                if interventions:
                    context_parts.append(f"\n【推荐干预】{', '.join(interventions[:3])}")

        # 4. 检查风险指标
        risk_keywords = self._questionnaire_knowledge["risk_indicators"]
        query_lower = query.lower()
        detected_risks = [r for r in risk_keywords if r in query or r in query_lower]
        if detected_risks:
            context_parts.append(f"\n【风险提示】检测到风险指标: {', '.join(detected_risks)}")

        # 5. 添加对话历史摘要
        if conversation_history and len(conversation_history) > 0:
            recent_history = conversation_history[-3:]  # 最近3轮对话
            context_parts.append("\n【近期对话】")
            for turn in recent_history:
                role = turn.get("role", "user")
                content = turn.get("content", "")[:100]
                context_parts.append(f"{role}: {content}")

        return "\n".join(context_parts)

    async def get_next_question_guidance(
        self,
        current_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        获取下一个问题的指导信息

        Args:
            current_context: 当前上下文，包含已收集的信息

        Returns:
            问题指导信息
        """
        guidance = {
            "suggested_area": None,
            "sample_questions": [],
            "reason": ""
        }

        # 确定下一个评估领域
        assessed_areas = current_context.get("assessed_areas", [])
        detected_symptoms = current_context.get("detected_symptoms", [])
        risk_level = current_context.get("risk_level", "low")

        # 优先处理高风险
        if risk_level == "high":
            guidance["suggested_area"] = "crisis"
            guidance["sample_questions"] = [
                "您提到这些想法，我想确认一下您的安全状况。",
                "您有没有想过具体怎么做？",
                "您身边有人可以陪伴您吗？"
            ]
            guidance["reason"] = "检测到高风险指标，需要优先评估安全状况"
            return guidance

        # 根据症状选择评估领域
        symptom_area_mapping = {
            "情绪低落": "mood",
            "沮丧": "mood",
            "焦虑": "anxiety",
            "紧张": "anxiety",
            "失眠": "sleep",
            "睡眠困难": "sleep",
            "疲劳": "energy",
            "乏力": "energy",
            "孤独": "social",
            "食欲不振": "appetite"
        }

        # 找到最相关的未评估领域
        for symptom in detected_symptoms:
            area_id = symptom_area_mapping.get(symptom)
            if area_id and area_id not in assessed_areas:
                for area in self._questionnaire_knowledge["assessment_areas"]:
                    if area["id"] == area_id:
                        guidance["suggested_area"] = area_id
                        guidance["sample_questions"] = area["sample_questions"]
                        guidance["reason"] = f"根据您提到的'{symptom}'，建议进一步了解"
                        return guidance

        # 默认建议
        for area in self._questionnaire_knowledge["assessment_areas"]:
            if area["id"] not in assessed_areas:
                guidance["suggested_area"] = area["id"]
                guidance["sample_questions"] = area["sample_questions"]
                guidance["reason"] = f"接下来让我们了解一下您的{area['name']}"
                return guidance

        # 所有领域都已评估
        guidance["suggested_area"] = "summary"
        guidance["reason"] = "主要评估已完成，可以生成评估报告"
        return guidance

    def get_standard_scale_questions(
        self,
        scale_name: str
    ) -> Optional[Dict[str, Any]]:
        """
        获取标准量表问题

        Args:
            scale_name: 量表名称 (PHQ-9 或 GAD-7)

        Returns:
            量表信息
        """
        return self._questionnaire_knowledge["standard_scales"].get(scale_name)

    def check_risk_indicators(self, text: str) -> List[str]:
        """
        检查文本中的风险指标

        Args:
            text: 待检查的文本

        Returns:
            检测到的风险指标列表
        """
        detected = []
        for indicator in self._questionnaire_knowledge["risk_indicators"]:
            if indicator in text:
                detected.append(indicator)
        return detected
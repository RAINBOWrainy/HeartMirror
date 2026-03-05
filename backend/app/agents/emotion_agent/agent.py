"""
Emotion Recognition Agent
基于微调BERT的情绪识别Agent
"""
from typing import Any, Dict, List, Optional

from app.agents.base_agent import BaseAgent, AgentResponse
from app.agents.emotion_agent.bert_classifier import EmotionBERTClassifier


class EmotionAgent(BaseAgent):
    """
    情绪识别Agent

    使用微调的中文BERT模型识别用户文本中的情绪
    """

    def __init__(
        self,
        model_path: Optional[str] = None,
        device: str = "cpu",
        **kwargs
    ):
        """
        初始化情绪识别Agent

        Args:
            model_path: BERT模型路径
            device: 运行设备 (cpu/cuda)
        """
        super().__init__(name="emotion_agent", **kwargs)
        self.device = device
        self.classifier = None
        self.model_path = model_path

        # 情绪标签映射 - 16种情绪类型
        self.emotion_labels = {
            0: "joy",        # 喜悦
            1: "sadness",    # 悲伤
            2: "anger",      # 愤怒
            3: "fear",       # 恐惧
            4: "disgust",    # 厌恶
            5: "surprise",   # 惊讶
            6: "anxiety",    # 焦虑
            7: "shame",      # 羞耻
            8: "guilt",      # 内疚
            9: "pride",      # 自豪
            10: "hope",      # 希望
            11: "frustration", # 挫败
            12: "loneliness", # 孤独
            13: "confusion", # 困惑
            14: "calm",      # 平静
            15: "neutral",   # 中性
        }

    def load_model(self, model_path: Optional[str] = None):
        """
        加载BERT模型

        Args:
            model_path: 模型路径
        """
        path = model_path or self.model_path
        if path:
            self.classifier = EmotionBERTClassifier(model_path=path, device=self.device)
        else:
            # 使用预训练的bert-base-chinese
            self.classifier = EmotionBERTClassifier(device=self.device)

    @property
    def default_system_prompt(self) -> str:
        return """你是一个专业的情绪识别助手。
你的任务是分析用户文本中的情绪状态，识别主要情绪和情绪强度。
你需要关注以下16种情绪类型：喜悦、悲伤、愤怒、恐惧、厌恶、惊讶、焦虑、羞耻、内疚、自豪、希望、挫败、孤独、困惑、平静、中性。
请以专业、同理心的方式进行分析。"""

    async def process(
        self,
        input_text: str,
        context: Optional[Dict[str, Any]] = None
    ) -> AgentResponse:
        """
        处理用户输入，识别情绪

        Args:
            input_text: 用户输入文本
            context: 上下文信息

        Returns:
            包含情绪识别结果的AgentResponse
        """
        if self.classifier is None:
            self.load_model()

        # 使用BERT分类器识别情绪
        result = self.classifier.predict(input_text)

        # 获取主要情绪
        primary_emotion = result.get("emotion", "neutral")
        intensity = result.get("intensity", 0.5)
        confidence = result.get("confidence", 0.0)
        all_scores = result.get("all_scores", {})

        # 判断是否为危机指标
        is_crisis_indicator = self._check_crisis_indicator(
            primary_emotion,
            intensity
        )

        # 生成分析结果
        content = self._generate_analysis(
            input_text,
            primary_emotion,
            intensity,
            confidence
        )

        return AgentResponse(
            content=content,
            metadata={
                "intensity": intensity,
                "confidence": confidence,
                "all_scores": all_scores,
                "is_crisis_indicator": is_crisis_indicator
            },
            emotion_detected=primary_emotion,
            risk_level=self._get_risk_level(primary_emotion, intensity)
        )

    def _check_crisis_indicator(
        self,
        emotion: str,
        intensity: float
    ) -> bool:
        """
        检查是否为危机指标情绪

        Args:
            emotion: 情绪类型
            intensity: 情绪强度

        Returns:
            是否为危机指标
        """
        crisis_emotions = {"fear", "anger", "anxiety", "shame", "guilt", "loneliness"}
        return emotion in crisis_emotions and intensity >= 0.8

    def _get_risk_level(self, emotion: str, intensity: float) -> str:
        """
        获取风险等级

        Args:
            emotion: 情绪类型
            intensity: 情绪强度

        Returns:
            风险等级 (green/yellow/orange/red)
        """
        negative_emotions = {
            "sadness", "anger", "fear", "anxiety",
            "shame", "guilt", "frustration", "loneliness"
        }

        if emotion not in negative_emotions:
            return "green"

        if intensity >= 0.8:
            return "red"
        elif intensity >= 0.6:
            return "orange"
        elif intensity >= 0.4:
            return "yellow"
        else:
            return "green"

    def _generate_analysis(
        self,
        text: str,
        emotion: str,
        intensity: float,
        confidence: float
    ) -> str:
        """
        生成情绪分析结果文本

        Args:
            text: 原始文本
            emotion: 识别的情绪
            intensity: 情绪强度
            confidence: 置信度

        Returns:
            分析结果文本
        """
        emotion_cn = {
            "joy": "喜悦",
            "sadness": "悲伤",
            "anger": "愤怒",
            "fear": "恐惧",
            "disgust": "厌恶",
            "surprise": "惊讶",
            "anxiety": "焦虑",
            "shame": "羞耻",
            "guilt": "内疚",
            "pride": "自豪",
            "hope": "希望",
            "frustration": "挫败",
            "loneliness": "孤独",
            "confusion": "困惑",
            "calm": "平静",
            "neutral": "中性"
        }

        intensity_desc = "轻微" if intensity < 0.3 else "中等" if intensity < 0.6 else "强烈"

        return f"情绪分析结果：检测到{intensity_desc}的{emotion_cn.get(emotion, emotion)}情绪（置信度：{confidence:.1%}）"
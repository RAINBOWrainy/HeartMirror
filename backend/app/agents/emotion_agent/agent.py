"""
Emotion Recognition Agent
情绪识别Agent - 使用混合情绪识别引擎

采用三层融合架构：
1. 关键词层：快速匹配
2. BERT层：模型分类（可选）
3. LLM层：语义理解（最终仲裁）
"""
from typing import Any, Dict, Optional

from app.agents.base_agent import BaseAgent, AgentResponse
from app.agents.emotion_agent.hybrid_emotion_engine import HybridEmotionEngine, get_hybrid_engine
from app.core.persona import HeartMirrorPersona


class EmotionAgent(BaseAgent):
    """
    情绪识别Agent

    使用混合情绪识别引擎识别用户文本中的情绪，
    并生成符合"朋友共情+妈妈暖心"风格的响应
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
            model_path: BERT模型路径（可选）
            device: 运行设备 (cpu/cuda)
        """
        super().__init__(name="emotion_agent", **kwargs)
        self.device = device
        self.model_path = model_path
        self._engine: Optional[HybridEmotionEngine] = None

    @property
    def engine(self) -> HybridEmotionEngine:
        """懒加载混合情绪识别引擎"""
        if self._engine is None:
            self._engine = get_hybrid_engine()
        return self._engine

    @property
    def default_system_prompt(self) -> str:
        return HeartMirrorPersona.BASE_PERSONA

    async def process(
        self,
        input_text: str,
        context: Optional[Dict[str, Any]] = None
    ) -> AgentResponse:
        """
        处理用户输入，识别情绪并生成共情响应

        Args:
            input_text: 用户输入文本
            context: 上下文信息（包含对话历史等）

        Returns:
            包含情绪识别结果和共情响应的AgentResponse
        """
        context = context or {}

        # 使用混合情绪识别引擎进行三层分析
        result = await self.engine.analyze(input_text, context)

        # 获取分析结果
        primary_emotion = result.get("emotion", "neutral")
        intensity = result.get("intensity", 0.5)
        confidence = result.get("confidence", 0.5)
        reasoning = result.get("reasoning", "")
        suggested_tone = result.get("suggested_tone", "温暖")

        # 判断是否为危机指标
        is_crisis_indicator = self._check_crisis_indicator(primary_emotion, intensity)

        # 生成共情响应（而非机械化输出）
        content = self._generate_empathetic_response(
            input_text=input_text,
            emotion=primary_emotion,
            intensity=intensity,
            context=context,
            suggested_tone=suggested_tone
        )

        return AgentResponse(
            content=content,
            metadata={
                "intensity": intensity,
                "confidence": confidence,
                "reasoning": reasoning,
                "suggested_tone": suggested_tone,
                "all_scores": result.get("all_scores", {}),
                "matched_keywords": result.get("matched_keywords", {}),
                "is_crisis_indicator": is_crisis_indicator
            },
            emotion_detected=primary_emotion,
            risk_level=self.engine.get_risk_level(primary_emotion, intensity)
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
        crisis_emotions = {"fear", "anger", "anxiety", "shame", "guilt", "loneliness", "sadness"}
        return emotion in crisis_emotions and intensity >= 0.8

    def _generate_empathetic_response(
        self,
        input_text: str,
        emotion: str,
        intensity: float,
        context: Optional[Dict[str, Any]],
        suggested_tone: str
    ) -> str:
        """
        生成共情式情绪响应

        不再输出机械化分析结果，而是生成符合"朋友共情+妈妈暖心"风格的响应

        Args:
            input_text: 用户输入
            emotion: 识别的情绪
            intensity: 情绪强度
            context: 上下文信息
            suggested_tone: 建议的回应语调

        Returns:
            共情式响应文本
        """
        # 使用统一人格系统获取情绪确认响应
        base_response = HeartMirrorPersona.get_emotion_acknowledge(emotion)

        # 根据强度添加额外的关心
        if intensity >= 0.7 and emotion in {"sadness", "anxiety", "fear", "loneliness", "frustration"}:
            concern_additions = [
                "这种感觉持续多久了？",
                "最近是不是遇到什么困难了？",
                "想多和我说说吗？",
                "我在这里，有什么都可以和我说。"
            ]
            import random
            base_response += f" {random.choice(concern_additions)}"

        return base_response
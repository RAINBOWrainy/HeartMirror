"""
LLM Service
大语言模型服务层 - OpenRouter集成
"""
from typing import Optional, List, Dict, Any
import asyncio
from functools import lru_cache

from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings


class LLMService:
    """
    大语言模型服务

    使用OpenRouter API调用GLM-4.5-Air模型
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        model: Optional[str] = None
    ):
        """
        初始化LLM服务

        Args:
            api_key: OpenRouter API密钥
            base_url: API基础URL
            model: 模型名称
        """
        self.api_key = api_key or settings.OPENROUTER_API_KEY
        self.base_url = base_url or settings.OPENROUTER_BASE_URL
        self.model = model or settings.LLM_MODEL

        self._client: Optional[OpenAI] = None

    @property
    def client(self) -> OpenAI:
        """懒加载OpenAI客户端"""
        if self._client is None:
            self._client = OpenAI(
                base_url=self.base_url,
                api_key=self.api_key,
                default_headers={
                    "HTTP-Referer": "https://heartmirror.app",
                    "X-Title": "HeartMirror"
                }
            )
        return self._client

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10)
    )
    def _call_api(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> str:
        """
        调用OpenRouter API

        Args:
            messages: 消息列表
            temperature: 温度参数
            max_tokens: 最大token数

        Returns:
            生成的文本
        """
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens
        )
        return response.choices[0].message.content

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> str:
        """
        生成文本响应

        Args:
            prompt: 用户输入
            system_prompt: 系统提示词
            temperature: 温度参数
            max_tokens: 最大token数

        Returns:
            生成的文本
        """
        messages = []

        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})

        messages.append({"role": "user", "content": prompt})

        # 在线程池中运行同步API调用
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: self._call_api(messages, temperature, max_tokens)
        )

        return result

    async def generate_with_history(
        self,
        prompt: str,
        history: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> str:
        """
        带对话历史的生成

        Args:
            prompt: 用户输入
            history: 对话历史
            system_prompt: 系统提示词
            temperature: 温度参数
            max_tokens: 最大token数

        Returns:
            生成的文本
        """
        messages = []

        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})

        # 添加对话历史
        for turn in history[-10:]:  # 保留最近10轮对话
            role = turn.get("role", "user")
            content = turn.get("content", "")
            if role in ["user", "assistant"]:
                messages.append({"role": role, "content": content})

        messages.append({"role": "user", "content": prompt})

        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: self._call_api(messages, temperature, max_tokens)
        )

        return result

    async def analyze_emotion(
        self,
        text: str
    ) -> Dict[str, Any]:
        """
        分析文本情绪（LLM辅助）

        Args:
            text: 待分析文本

        Returns:
            情绪分析结果
        """
        system_prompt = """你是一个专业的情绪分析助手。请分析用户文本中的情绪状态。
请以JSON格式返回结果，包含以下字段：
- primary_emotion: 主要情绪（喜悦/悲伤/愤怒/恐惧/焦虑/平静/惊讶）
- intensity: 情绪强度（0-1之间的数值）
- secondary_emotions: 次要情绪列表
- reasoning: 简短的分析理由

只返回JSON，不要有其他内容。"""

        prompt = f"请分析以下文本的情绪：\n\n{text}"

        try:
            result = await self.generate(
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=0.3,
                max_tokens=500
            )

            # 解析JSON结果
            import json
            # 尾部清理
            result = result.strip()
            if result.startswith("```json"):
                result = result[7:]
            if result.startswith("```"):
                result = result[3:]
            if result.endswith("```"):
                result = result[:-3]

            return json.loads(result)

        except Exception as e:
            # 降级返回默认结果
            return {
                "primary_emotion": "平静",
                "intensity": 0.5,
                "secondary_emotions": [],
                "reasoning": f"LLM分析失败，使用默认结果: {str(e)}"
            }

    async def generate_questionnaire_question(
        self,
        context: Dict[str, Any]
    ) -> str:
        """
        生成问卷问题

        Args:
            context: 上下文信息，包含已收集的信息

        Returns:
            生成的问卷问题
        """
        system_prompt = """你是一个专业的心理健康评估助手。
你的任务是根据用户的回答和当前评估上下文，生成下一个合适的评估问题。

要求：
1. 问题应该简洁明了
2. 问题应该有助于了解用户的心理状态
3. 如果用户表现出高风险迹象，应该优先关注安全问题
4. 保持同理心和专业态度

只返回问题本身，不要有其他内容。"""

        prompt = f"""请根据以下上下文生成下一个评估问题：

已评估领域：{context.get('assessed_areas', [])}
已检测症状：{context.get('detected_symptoms', [])}
风险等级：{context.get('risk_level', 'green')}
用户最后回复：{context.get('last_response', '')}

请生成下一个合适的评估问题。"""

        return await self.generate(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.7,
            max_tokens=200
        )

    async def generate_intervention_suggestion(
        self,
        user_context: Dict[str, Any],
        emotion_state: Optional[Dict] = None
    ) -> str:
        """
        生成干预建议

        Args:
            user_context: 用户上下文
            emotion_state: 情绪状态

        Returns:
            干预建议
        """
        system_prompt = """你是一个专业的心理健康干预助手。
基于用户的情绪状态和评估结果，提供个性化的干预建议。

要求：
1. 建议应该具体可行
2. 建议应该基于循证实践
3. 保持温暖、支持的语调
4. 如果风险较高，建议寻求专业帮助

返回简洁的建议内容。"""

        prompt = f"""请为以下用户生成干预建议：

情绪状态：{emotion_state or '未知'}
检测到的症状：{user_context.get('symptoms', [])}
风险等级：{user_context.get('risk_level', 'green')}

请生成个性化的干预建议。"""

        return await self.generate(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.7,
            max_tokens=500
        )

    async def generate_chat_response(
        self,
        user_input: str,
        conversation_history: List[Dict[str, str]],
        emotion_detected: Optional[str] = None,
        risk_level: str = "green"
    ) -> str:
        """
        生成对话响应

        Args:
            user_input: 用户输入
            conversation_history: 对话历史
            emotion_detected: 检测到的情绪
            risk_level: 风险等级

        Returns:
            对话响应
        """
        system_prompt = """你是HeartMirror心理健康助手，一个温暖、专业的AI助手。
你的职责是：
1. 倾听用户的情绪和烦恼
2. 提供情感支持和理解
3. 引导用户进行自我探索
4. 在必要时提供专业资源建议

注意：
- 不做医疗诊断
- 发现高风险信号时提醒用户寻求专业帮助
- 保持同理心和专业态度
- 回复简洁温暖，不要过长"""

        # 构建上下文提示
        context_info = f"[检测到的情绪: {emotion_detected or '未知'}, 风险等级: {risk_level}]"

        messages = [{"role": "system", "content": system_prompt}]

        # 添加对话历史
        for turn in conversation_history[-6:]:
            role = turn.get("role", "user")
            content = turn.get("content", "")
            if role in ["user", "assistant"]:
                messages.append({"role": role, "content": content})

        messages.append({"role": "user", "content": f"{context_info}\n用户说：{user_input}"})

        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: self._call_api(messages, temperature=0.7, max_tokens=500)
        )

        return result


# 全局单例
_llm_service: Optional[LLMService] = None


def get_llm_service() -> LLMService:
    """获取LLM服务单例"""
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service
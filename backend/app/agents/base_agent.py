"""
Base Agent Class
LangChain Agent基类，所有Agent的父类
"""
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from pydantic import BaseModel


class AgentResponse(BaseModel):
    """Agent响应模型"""
    content: str
    metadata: Optional[Dict[str, Any]] = None
    emotion_detected: Optional[str] = None
    risk_level: Optional[str] = None


class BaseAgent(ABC):
    """
    Agent基类

    所有HeartMirror Agent必须继承此类并实现process方法
    """

    def __init__(
        self,
        name: str,
        llm: Optional[BaseChatModel] = None,
        system_prompt: Optional[str] = None,
        **kwargs
    ):
        """
        初始化Agent

        Args:
            name: Agent名称
            llm: 语言模型实例
            system_prompt: 系统提示词
        """
        self.name = name
        self.llm = llm
        self.system_prompt = system_prompt or self.default_system_prompt
        self.config = kwargs

    @property
    def default_system_prompt(self) -> str:
        """默认系统提示词"""
        return "你是HeartMirror心理健康助手，专注于帮助用户管理情绪和心理健康。"

    def create_prompt_template(
        self,
        template: str,
        input_variables: List[str]
    ) -> ChatPromptTemplate:
        """
        创建提示词模板

        Args:
            template: 模板字符串
            input_variables: 输入变量列表

        Returns:
            ChatPromptTemplate实例
        """
        return ChatPromptTemplate.from_messages([
            ("system", self.system_prompt),
            ("human", template)
        ])

    def build_chain(self, prompt: ChatPromptTemplate):
        """
        构建处理链

        Args:
            prompt: 提示词模板

        Returns:
            LCEL处理链
        """
        if self.llm is None:
            raise ValueError("LLM未初始化")
        return prompt | self.llm | StrOutputParser()

    @abstractmethod
    async def process(
        self,
        input_text: str,
        context: Optional[Dict[str, Any]] = None
    ) -> AgentResponse:
        """
        处理用户输入（抽象方法，子类必须实现）

        Args:
            input_text: 用户输入文本
            context: 上下文信息

        Returns:
            AgentResponse实例
        """
        pass

    def update_context(
        self,
        context: Dict[str, Any],
        key: str,
        value: Any
    ) -> Dict[str, Any]:
        """
        更新上下文

        Args:
            context: 当前上下文
            key: 键
            value: 值

        Returns:
            更新后的上下文
        """
        context[key] = value
        return context

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__} name={self.name}>"
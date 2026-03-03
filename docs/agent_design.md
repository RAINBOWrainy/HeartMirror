# Agent 设计文档

## 概述

HeartMirror采用基于LangChain的多Agent协同架构，每个Agent专注于特定任务，通过Orchestrator协调工作。

## Agent基类设计

```python
class BaseAgent(ABC):
    """Agent基类"""
    name: str
    llm: BaseChatModel
    system_prompt: str

    @abstractmethod
    async def process(input_text: str, context: Dict) -> AgentResponse:
        """处理用户输入"""
        pass
```

## 各Agent详细设计

### 1. EmotionAgent (情绪识别Agent)

**职责**：识别用户文本中的情绪状态

**输入**：
- 用户文本
- 上下文信息（可选）

**输出**：
- 主要情绪类型 (joy/sadness/anger/fear/anxiety/neutral/surprise)
- 情绪强度 (0-1)
- 置信度
- 风险等级

**技术实现**：
- 使用微调的中文BERT模型
- 情绪分类 + 强度回归
- 危机指标检测

```python
class EmotionAgent(BaseAgent):
    def __init__(self, model_path: str = None):
        self.classifier = EmotionBERTClassifier(model_path)

    async def process(self, input_text: str, context: Dict = None):
        result = self.classifier.predict(input_text)
        return AgentResponse(
            emotion_detected=result["emotion"],
            metadata={
                "intensity": result["intensity"],
                "confidence": result["confidence"]
            },
            risk_level=self._get_risk_level(result)
        )
```

### 2. QuestionnaireAgent (动态问卷Agent)

**职责**：通过对话式问卷收集评估信息

**特点**：
- RAG驱动的动态问题生成
- 基于用户回答调整后续问题
- 支持标准化量表（PHQ-9、GAD-7）

**技术实现**：
- ChromaDB存储问卷模板
- Sentence-BERT语义检索
- LangChain对话链

### 3. RiskAgent (风险量化Agent)

**职责**：综合多维度信息评估风险等级

**风险分层**：
| 等级 | 描述 | 响应 |
|------|------|------|
| green | 低风险 | 正常服务 |
| yellow | 中等风险 | 加强关注 |
| orange | 较高风险 | 建议专业帮助 |
| red | 高风险 | 危机干预 |

**评估维度**：
- 情绪状态 (30%)
- 行为表现 (25%)
- 认知功能 (20%)
- 社交状况 (15%)
- 危险信号 (10%)

### 4. InterventionAgent (干预方案Agent)

**职责**：推荐个性化干预方案

**干预类型**：
- CBT (认知行为疗法)
- 正念冥想
- 呼吸训练
- 运动建议
- 社交活动
- 自我关怀

**推荐逻辑**：
1. 根据情绪类型筛选候选干预
2. 考虑用户偏好和历史效果
3. 生成具体操作步骤
4. 设置跟进计划

## Orchestrator协调逻辑

```python
class AgentOrchestrator:
    """Agent协调器"""

    async def process_message(self, user_input: str):
        # 1. 情绪识别
        emotion_result = await self.emotion_agent.process(user_input)

        # 2. 根据情绪决定下一步
        if emotion_result.metadata["is_crisis_indicator"]:
            # 高风险 → 风险评估 → 危机支持
            risk_result = await self.risk_agent.process(user_input, emotion_result)
            return self.generate_crisis_response(risk_result)

        # 3. 正常流程：问卷 → 风险评估 → 干预
        questionnaire_result = await self.questionnaire_agent.process(user_input)
        risk_result = await self.risk_agent.process(user_input, questionnaire_result)
        intervention_result = await self.intervention_agent.process(user_input, risk_result)

        return intervention_result
```

## Agent通信协议

Agent之间通过共享Context传递信息：

```python
context = {
    "emotion": {"type": "sadness", "intensity": 0.6},
    "questionnaire": {"score": 12, "type": "PHQ-9"},
    "risk_level": "yellow",
    "user_preferences": {"prefers_meditation": True}
}
```
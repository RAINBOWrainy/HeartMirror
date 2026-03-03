# HeartMirror 数据模型文档

## 用户模型 (User)

```python
class User:
    id: UUID                    # 用户唯一标识
    anonymous_id: str           # 匿名ID（用户自定义）
    password_hash: str          # 密码哈希
    encrypted_profile: str      # 加密的用户画像
    risk_level: str             # 风险等级 (green/yellow/orange/red)
    is_active: bool             # 是否活跃
    consent_given: bool         # 是否同意隐私政策
    disclaimer_accepted: bool   # 是否接受免责声明
    created_at: datetime        # 创建时间
    updated_at: datetime        # 更新时间
    last_active_at: datetime    # 最后活跃时间
```

## 情绪记录模型 (EmotionRecord)

```python
class EmotionRecord:
    id: UUID                    # 记录唯一标识
    user_id: UUID               # 用户ID
    primary_emotion: EmotionType # 主要情绪类型
    intensity: float            # 情绪强度 (0-1)
    confidence: float           # 置信度
    emotion_scores: dict        # 多情绪得分
    source_type: str            # 来源类型 (chat/diary/questionnaire)
    encrypted_text: str         # 加密的原始文本
    context_tags: List[str]     # 情境标签
    is_diary: bool              # 是否为日记
    recorded_at: datetime       # 记录时间
```

## 情绪类型枚举 (EmotionType)

```python
class EmotionType(Enum):
    JOY = "joy"                 # 喜悦
    SADNESS = "sadness"         # 悲伤
    ANGER = "anger"             # 愤怒
    FEAR = "fear"               # 恐惧
    DISGUST = "disgust"         # 厌恶
    SURPRISE = "surprise"       # 惊讶
    ANXIETY = "anxiety"         # 焦虑
    SHAME = "shame"             # 羞耻
    GUILT = "guilt"             # 内疚
    PRIDE = "pride"             # 自豪
    HOPE = "hope"               # 希望
    FRUSTRATION = "frustration" # 挫败
    LONELINESS = "loneliness"   # 孤独
    CONFUSION = "confusion"     # 困惑
    CALM = "calm"               # 平静
    NEUTRAL = "neutral"         # 中性
```

## 问卷会话模型 (QuestionnaireSession)

```python
class QuestionnaireSession:
    id: UUID                    # 会话ID
    user_id: UUID               # 用户ID
    questionnaire_type: QuestionnaireType  # 问卷类型
    questions: dict             # 问题列表
    total_score: int            # 总分
    dimension_scores: dict      # 分维度得分
    encrypted_interpretation: str  # 加密的评估解读
    risk_level: str             # 风险等级
    is_completed: bool          # 是否完成
    started_at: datetime        # 开始时间
    completed_at: datetime      # 完成时间
```

## 干预方案模型 (InterventionPlan)

```python
class InterventionPlan:
    id: UUID                    # 方案ID
    user_id: UUID               # 用户ID
    name: str                   # 方案名称
    intervention_type: InterventionType  # 干预类型
    content: dict               # 方案内容
    trigger_conditions: dict    # 触发条件
    difficulty_level: int       # 难度等级 (1-5)
    estimated_duration: int     # 预计时长（分钟）
    effectiveness_score: float  # 效果评分
    is_active: bool             # 是否活跃
    is_recommended: bool        # 是否为推荐方案
```

## 对话会话模型 (ChatSession)

```python
class ChatSession:
    id: UUID                    # 会话ID
    user_id: UUID               # 用户ID
    title: str                  # 会话标题
    status: str                 # 状态 (active/archived/deleted)
    current_stage: str          # 当前阶段
    context: dict               # 会话上下文
    active_agents: List[str]    # 活跃Agent列表
    message_count: int          # 消息数量
    started_at: datetime        # 开始时间
    last_message_at: datetime   # 最后消息时间
```

## 消息模型 (ChatMessage)

```python
class ChatMessage:
    id: UUID                    # 消息ID
    session_id: UUID            # 会话ID
    role: MessageRole           # 角色 (user/assistant/system)
    encrypted_content: str      # 加密的消息内容
    emotion_detected: str       # 检测到的情绪
    emotion_intensity: float    # 情绪强度
    agent_name: str             # 生成消息的Agent
    metadata: dict              # 元数据
    created_at: datetime        # 创建时间
```
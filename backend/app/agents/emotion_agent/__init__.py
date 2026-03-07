"""Emotion Recognition Agent Module"""
# 延迟导入 - 避免启动时加载重型依赖
# 使用时通过 from app.agents.emotion_agent.agent import EmotionAgent 导入

__all__ = ["EmotionAgent", "EmotionBERTClassifier"]


def __getattr__(name):
    """延迟导入Agent和BERT分类器"""
    if name == "EmotionAgent":
        from app.agents.emotion_agent.agent import EmotionAgent
        return EmotionAgent
    if name == "EmotionBERTClassifier":
        try:
            from app.agents.emotion_agent.bert_classifier import EmotionBERTClassifier
            return EmotionBERTClassifier
        except ImportError:
            return None
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
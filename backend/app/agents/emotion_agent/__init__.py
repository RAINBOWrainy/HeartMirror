"""Emotion Recognition Agent Module"""
from app.agents.emotion_agent.agent import EmotionAgent

# BERT分类器可选导入（需要torch）
try:
    from app.agents.emotion_agent.bert_classifier import EmotionBERTClassifier
except ImportError:
    # torch未安装时，BERT分类器不可用
    EmotionBERTClassifier = None

__all__ = ["EmotionAgent", "EmotionBERTClassifier"]
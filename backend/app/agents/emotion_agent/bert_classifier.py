"""
Emotion BERT Classifier
基于中文BERT的情绪分类器

注意：此模块需要 torch 和 transformers 库。
在生产环境中如果这些库不可用，会降级到简单的情绪分析。
"""
from typing import Dict, List, Optional, Tuple
import logging

logger = logging.getLogger(__name__)

# 尝试导入 ML 库，如果不可用则使用降级方案
try:
    import torch
    from transformers import BertTokenizer, BertForSequenceClassification
    import numpy as np
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False
    logger.warning("torch/transformers not available, using fallback emotion classifier")


class EmotionBERTClassifier:
    """
    情绪分类器

    使用中文BERT模型进行情绪分类
    如果 ML 库不可用，使用简单的关键词匹配降级方案
    """

    # 默认情绪标签
    DEFAULT_LABELS = [
        "joy",        # 喜悦
        "sadness",    # 悲伤
        "anger",      # 愤怒
        "fear",       # 恐惧
        "anxiety",    # 焦虑
        "neutral",    # 中性
        "surprise",   # 惊讶
    ]

    # 简单情绪关键词（降级方案）
    EMOTION_KEYWORDS = {
        "joy": ["开心", "快乐", "高兴", "幸福", "喜悦", "愉快", "棒", "好", "太好了", "哈哈"],
        "sadness": ["难过", "伤心", "悲伤", "沮丧", "失落", "痛苦", "哭", "泪"],
        "anger": ["生气", "愤怒", "恼火", "烦", "讨厌", "可恶", "气愤"],
        "fear": ["害怕", "恐惧", "担心", "紧张", "不安", "惊恐"],
        "anxiety": ["焦虑", "烦躁", "忧虑", "压力", "纠结", "不知所措"],
        "surprise": ["惊讶", "意外", "震惊", "没想到", "居然"],
    }

    def __init__(
        self,
        model_path: Optional[str] = None,
        model_name: str = "bert-base-chinese",
        device: str = "cpu",
        num_labels: int = 7
    ):
        """
        初始化分类器
        """
        self.num_labels = num_labels
        self.labels = self.DEFAULT_LABELS[:num_labels]
        self.ml_available = ML_AVAILABLE

        if ML_AVAILABLE:
            self.device = torch.device(device)
            self.tokenizer = BertTokenizer.from_pretrained(model_name)

            if model_path:
                self.model = BertForSequenceClassification.from_pretrained(
                    model_path, num_labels=num_labels
                )
            else:
                self.model = BertForSequenceClassification.from_pretrained(
                    model_name, num_labels=num_labels
                )

            self.model.to(self.device)
            self.model.eval()
        else:
            logger.info("Using fallback emotion classifier (keyword-based)")

    def predict(self, text: str) -> Dict:
        """预测情绪"""
        if self.ml_available:
            return self._predict_with_model(text)
        else:
            return self._predict_with_keywords(text)

    def _predict_with_model(self, text: str) -> Dict:
        """使用 BERT 模型预测"""
        inputs = self._preprocess(text)

        with torch.no_grad():
            outputs = self.model(**inputs)
            logits = outputs.logits
            probs = torch.softmax(logits, dim=-1)[0].cpu().numpy()
            predicted_class = np.argmax(probs)
            predicted_emotion = self.labels[predicted_class]
            confidence = probs[predicted_class]
            intensity = self._calculate_intensity(probs)
            all_scores = {label: float(prob) for label, prob in zip(self.labels, probs)}

            return {
                "emotion": predicted_emotion,
                "intensity": intensity,
                "confidence": float(confidence),
                "all_scores": all_scores
            }

    def _predict_with_keywords(self, text: str) -> Dict:
        """使用关键词匹配预测（降级方案）"""
        scores = {}

        for emotion in self.labels:
            keywords = self.EMOTION_KEYWORDS.get(emotion, [])
            score = sum(1 for kw in keywords if kw in text) / max(len(keywords), 1)
            scores[emotion] = score

        if all(s == 0 for s in scores.values()):
            scores["neutral"] = 1.0

        predicted_emotion = max(scores, key=scores.get)
        confidence = scores[predicted_emotion]

        return {
            "emotion": predicted_emotion,
            "intensity": min(confidence * 2, 1.0),
            "confidence": confidence,
            "all_scores": scores
        }

    def _preprocess(self, text: str, max_length: int = 128) -> Dict:
        """文本预处理"""
        encoding = self.tokenizer(
            text,
            add_special_tokens=True,
            max_length=max_length,
            padding="max_length",
            truncation=True,
            return_tensors="pt"
        )
        return {
            "input_ids": encoding["input_ids"].to(self.device),
            "attention_mask": encoding["attention_mask"].to(self.device)
        }

    def _calculate_intensity(self, probs) -> float:
        """计算情绪强度"""
        max_entropy = np.log(len(probs))
        entropy = -np.sum(probs * np.log(probs + 1e-10))
        return float(1 - entropy / max_entropy)

    def predict_batch(self, texts: List[str]) -> List[Dict]:
        """批量预测"""
        return [self.predict(text) for text in texts]

    def fine_tune(self, train_data: List[Tuple[str, int]], epochs: int = 3,
                  batch_size: int = 16, learning_rate: float = 2e-5):
        """微调模型"""
        if not self.ml_available:
            logger.warning("Fine-tuning not available without ML libraries")
            return
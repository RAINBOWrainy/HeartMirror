"""
Emotion BERT Classifier
基于中文BERT的情绪分类器
"""
from typing import Dict, List, Optional, Tuple
import torch
from transformers import BertTokenizer, BertForSequenceClassification
import numpy as np


class EmotionBERTClassifier:
    """
    情绪分类器

    使用中文BERT模型进行情绪分类
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

    def __init__(
        self,
        model_path: Optional[str] = None,
        model_name: str = "bert-base-chinese",
        device: str = "cpu",
        num_labels: int = 7
    ):
        """
        初始化分类器

        Args:
            model_path: 微调模型路径
            model_name: 预训练模型名称
            device: 运行设备
            num_labels: 分类标签数量
        """
        self.device = torch.device(device)
        self.num_labels = num_labels
        self.labels = self.DEFAULT_LABELS[:num_labels]

        # 加载tokenizer
        self.tokenizer = BertTokenizer.from_pretrained(model_name)

        # 加载模型
        if model_path:
            self.model = BertForSequenceClassification.from_pretrained(
                model_path,
                num_labels=num_labels
            )
        else:
            self.model = BertForSequenceClassification.from_pretrained(
                model_name,
                num_labels=num_labels
            )

        self.model.to(self.device)
        self.model.eval()

    def preprocess(self, text: str, max_length: int = 128) -> Dict[str, torch.Tensor]:
        """
        文本预处理

        Args:
            text: 输入文本
            max_length: 最大长度

        Returns:
            模型输入张量
        """
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

    @torch.no_grad()
    def predict(self, text: str) -> Dict:
        """
        预测情绪

        Args:
            text: 输入文本

        Returns:
            包含预测结果的字典
        """
        inputs = self.preprocess(text)

        outputs = self.model(**inputs)
        logits = outputs.logits

        # 获取概率分布
        probs = torch.softmax(logits, dim=-1)[0].cpu().numpy()

        # 获取预测类别
        predicted_class = np.argmax(probs)
        predicted_emotion = self.labels[predicted_class]
        confidence = probs[predicted_class]

        # 计算情绪强度（基于概率分布的熵）
        intensity = self._calculate_intensity(probs)

        # 所有类别的分数
        all_scores = {label: float(prob) for label, prob in zip(self.labels, probs)}

        return {
            "emotion": predicted_emotion,
            "intensity": intensity,
            "confidence": float(confidence),
            "all_scores": all_scores
        }

    def _calculate_intensity(self, probs: np.ndarray) -> float:
        """
        计算情绪强度

        基于概率分布的熵来计算情绪强度
        熵越低表示模型越确定，情绪越强烈

        Args:
            probs: 概率分布

        Returns:
            情绪强度 (0-1)
        """
        # 计算归一化熵
        max_entropy = np.log(len(probs))
        entropy = -np.sum(probs * np.log(probs + 1e-10))
        normalized_entropy = entropy / max_entropy

        # 熵越低，强度越高
        intensity = 1 - normalized_entropy

        return float(intensity)

    def predict_batch(self, texts: List[str]) -> List[Dict]:
        """
        批量预测

        Args:
            texts: 文本列表

        Returns:
            预测结果列表
        """
        return [self.predict(text) for text in texts]

    def fine_tune(
        self,
        train_data: List[Tuple[str, int]],
        epochs: int = 3,
        batch_size: int = 16,
        learning_rate: float = 2e-5
    ):
        """
        微调模型

        Args:
            train_data: 训练数据 [(text, label), ...]
            epochs: 训练轮数
            batch_size: 批量大小
            learning_rate: 学习率
        """
        # TODO: 实现微调逻辑
        pass
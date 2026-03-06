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

    # 默认情绪标签 - 16种情绪类型
    DEFAULT_LABELS = [
        "joy",        # 喜悦
        "sadness",    # 悲伤
        "anger",      # 愤怒
        "fear",       # 恐惧
        "disgust",    # 厌恶
        "surprise",   # 惊讶
        "anxiety",    # 焦虑
        "shame",      # 羞耻
        "guilt",      # 内疚
        "pride",      # 自豪
        "hope",       # 希望
        "frustration", # 挫败
        "loneliness", # 孤独
        "confusion",  # 困惑
        "calm",       # 平静
        "neutral",    # 中性
    ]

    # 扩展情绪关键词库（降级方案）- 16种情绪，更全面覆盖
    EMOTION_KEYWORDS = {
        "joy": [
            "开心", "快乐", "高兴", "幸福", "喜悦", "愉快", "棒", "好", "太好了",
            "哈哈", "乐", "欢喜", "满足", "兴奋", "美好", "甜", "温馨", "感动",
            "欣慰", "舒畅", "心花怒放", "喜出望外", "乐呵呵", "美滋滋"
        ],
        "sadness": [
            "难过", "伤心", "悲伤", "沮丧", "失落", "痛苦", "哭", "泪", "忧郁",
            "哀伤", "心痛", "郁闷", "不开心", "难受", "心酸", "悲痛", "凄凉",
            "绝望", "心碎", "愁眉苦脸", "郁郁寡欢", "闷闷不乐", "悲哀"
        ],
        "anger": [
            "生气", "愤怒", "恼火", "烦", "讨厌", "可恶", "气愤", "火大", "暴怒",
            "憎恨", "无语", "恼怒", "愤恨", "发火", "不爽", "气死", "气人",
            "火冒三丈", "怒气冲冲", "恼羞成怒"
        ],
        "fear": [
            "害怕", "恐惧", "担心", "紧张", "不安", "惊恐", "怕", "惶恐", "胆怯",
            "慌", "恐慌", "惧怕", "忧虑", "忐忑", "心惊", "吓人", "心惊肉跳",
            "提心吊胆", "胆战心惊"
        ],
        "disgust": [
            "恶心", "厌恶", "反感", "讨厌", "嫌", "看不惯", "鄙视", "嫌弃",
            "憎恶", "作呕", "反感"
        ],
        "surprise": [
            "惊讶", "意外", "震惊", "没想到", "居然", "出乎意料", "想不到", "天哪",
            "不可思议", "大吃一惊", "始料未及", "大跌眼镜"
        ],
        "anxiety": [
            "焦虑", "烦躁", "忧虑", "压力", "纠结", "不知所措", "焦躁", "坐立不安",
            "心慌", "着急", "慌", "焦虑感", "心急", "急躁", "烦闷", "心烦意乱",
            "焦灼", "如坐针毡", "心神不宁", "惴惴不安"
        ],
        "shame": [
            "羞耻", "丢脸", "尴尬", "不好意思", "脸红", "无地自容", "羞愧", "难堪",
            "羞愧难当", "无颜", "自惭形秽"
        ],
        "guilt": [
            "内疚", "愧疚", "对不起", "自责", "亏欠", "抱歉", "懊悔", "悔恨",
            "良心不安", "过意不去", "悔不当初"
        ],
        "pride": [
            "自豪", "骄傲", "成就感", "得意", "光荣", "自信", "扬眉吐气",
            "心满意足", "有成就感"
        ],
        "hope": [
            "希望", "期待", "向往", "憧憬", "盼望", "愿望", "梦想", "未来",
            "期盼", "希冀", "憧憬未来", "抱有希望"
        ],
        "frustration": [
            "挫败", "沮丧", "灰心", "失败", "打击", "受挫", "无力", "气馁",
            "没劲", "提不起劲", "累", "疲惫", "好累", "心累", "好疲惫", "精疲力竭",
            "心力交瘁", "筋疲力尽", "无精打采", "萎靡不振", "泄气", "颓废",
            "无力感", "挫败感", "迷茫", "不知道该怎么办", "没办法", "无助",
            "什么都不想做", "没动力", "坚持不下去了"
        ],
        "loneliness": [
            "孤独", "寂寞", "孤单", "没人理解", "一个人", "落单", "独处", "没人陪",
            "空虚", "无聊", "寂寞难耐", "形影相吊", "孤零零", "孑然一身",
            "与世隔绝", "孤僻", "没人说话"
        ],
        "confusion": [
            "困惑", "迷茫", "不解", "搞不懂", "糊涂", "不清楚", "纠结",
            "一头雾水", "摸不着头脑", "稀里糊涂", "百思不解", "分不清"
        ],
        "calm": [
            "平静", "安宁", "放松", "轻松", "镇定", "淡然", "从容", "心平气和",
            "心如止水", "气定神闲", "泰然自若", "安心"
        ],
        "neutral": [
            "一般", "还行", "普通", "没什么", "正常", "还可以", "还好"
        ]
    }

    def __init__(
        self,
        model_path: Optional[str] = None,
        model_name: str = "bert-base-chinese",
        device: str = "cpu",
        num_labels: int = 16
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
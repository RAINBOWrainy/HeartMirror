"""
Hybrid Emotion Recognition Engine
混合情绪识别引擎 - 三层融合架构

架构：
1. 关键词层：快速匹配，扩展词库
2. BERT层：模型分类（可选，权重较低）
3. LLM层：语义理解，最终仲裁
"""
from typing import Dict, List, Optional, Any
import logging
import json

from app.services.llm_service import get_llm_service

logger = logging.getLogger(__name__)


class HybridEmotionEngine:
    """
    混合情绪识别引擎

    采用三层融合架构，以LLM语义分析为核心，
    结合关键词匹配和BERT分类（可选）提供准确的情绪识别
    """

    # 扩展的情绪关键词库 - 更全面的中情绪词汇
    EMOTION_KEYWORDS = {
        "joy": [
            "开心", "快乐", "高兴", "幸福", "喜悦", "愉快", "棒", "好", "太好了",
            "哈哈", "乐", "欢喜", "满足", "兴奋", "美好", "甜", "温馨", "感动",
            "欣慰", "舒畅", "心花怒放", "喜出望外", "乐呵呵", "美滋滋"
        ],
        "sadness": [
            "难过", "伤心", "悲伤", "沮丧", "失落", "痛苦", "哭", "泪", "忧郁",
            "哀伤", "心痛", "郁闷", "不开心", "难受", "心酸", "悲伤", "悲痛",
            "凄凉", "绝望", "心碎", "愁眉苦脸", "郁郁寡欢", "闷闷不乐"
        ],
        "anger": [
            "生气", "愤怒", "恼火", "烦", "讨厌", "可恶", "气愤", "火大", "暴怒",
            "憎恨", "无语", "恼怒", "愤恨", "发火", "不爽", "气死", "气人",
            "火冒三丈", "怒气冲冲", "恼羞成怒"
        ],
        "fear": [
            "害怕", "恐惧", "担心", "紧张", "不安", "惊恐", "怕", "惶恐", "胆怯",
            "慌", "恐慌", "惧怕", "忧虑", "忐忑", "心惊", "害怕", "吓人",
            "心惊肉跳", "提心吊胆", "胆战心惊"
        ],
        "anxiety": [
            "焦虑", "烦躁", "忧虑", "压力", "纠结", "不知所措", "焦躁", "坐立不安",
            "心慌", "着急", "慌", "焦虑感", "心急", "急躁", "烦闷", "心烦意乱",
            "焦灼", "如坐针毡", "心神不宁", "惴惴不安"
        ],
        "frustration": [
            "挫败", "沮丧", "灰心", "失败", "打击", "受挫", "无力", "气馁",
            "没劲", "提不起劲", "累", "疲惫", "好累", "心累", "好疲惫", "精疲力竭",
            "心力交瘁", "筋疲力尽", "无精打采", "萎靡不振", "泄气", "颓废",
            "无力感", "挫败感", "迷茫", "不知道该怎么办", "没办法", "无助"
        ],
        "loneliness": [
            "孤独", "寂寞", "孤单", "没人理解", "一个人", "落单", "独处", "没人陪",
            "空虚", "无聊", "寂寞难耐", "形影相吊", "孤零零", "孑然一身",
            "与世隔绝", "孤僻"
        ],
        "shame": [
            "羞耻", "丢脸", "尴尬", "不好意思", "脸红", "无地自容", "羞愧", "难堪",
            "羞愧难当", "无颜", "愧疚", "自惭形秽"
        ],
        "guilt": [
            "内疚", "愧疚", "对不起", "自责", "亏欠", "抱歉", "懊悔", "悔恨",
            "对不起", "良心不安", "过意不去", "悔不当初"
        ],
        "pride": [
            "自豪", "骄傲", "成就感", "得意", "光荣", "骄傲", "自信", "扬眉吐气",
            "心满意足", "有成就感"
        ],
        "hope": [
            "希望", "期待", "向往", "憧憬", "盼望", "愿望", "梦想", "未来",
            "期盼", "希冀", "憧憬未来", "抱有希望"
        ],
        "surprise": [
            "惊讶", "意外", "震惊", "没想到", "居然", "出乎意料", "想不到", "天哪",
            "不可思议", "大吃一惊", "始料未及", "大跌眼镜"
        ],
        "confusion": [
            "困惑", "迷茫", "不解", "搞不懂", "糊涂", "不清楚", "纠结",
            "一头雾水", "摸不着头脑", "稀里糊涂", "百思不解"
        ],
        "calm": [
            "平静", "安宁", "放松", "轻松", "镇定", "淡然", "从容", "心平气和",
            "心如止水", "气定神闲", "泰然自若"
        ],
        "neutral": [
            "一般", "还行", "普通", "没什么", "正常", "还可以"
        ]
    }

    # 情绪权重映射（用于风险评估）
    EMOTION_WEIGHTS = {
        "joy": 0.1,
        "sadness": 0.5,
        "anger": 0.6,
        "fear": 0.7,
        "anxiety": 0.5,
        "frustration": 0.4,
        "loneliness": 0.5,
        "shame": 0.4,
        "guilt": 0.4,
        "pride": 0.1,
        "hope": 0.1,
        "surprise": 0.2,
        "confusion": 0.2,
        "calm": 0.1,
        "neutral": 0.1
    }

    # 中文情绪名称映射
    EMOTION_CN = {
        "joy": "喜悦",
        "sadness": "悲伤",
        "anger": "愤怒",
        "fear": "恐惧",
        "anxiety": "焦虑",
        "frustration": "挫败/疲惫",
        "loneliness": "孤独",
        "shame": "羞耻",
        "guilt": "内疚",
        "pride": "自豪",
        "hope": "希望",
        "surprise": "惊讶",
        "confusion": "困惑",
        "calm": "平静",
        "neutral": "中性"
    }

    def __init__(self, bert_classifier=None):
        """
        初始化混合情绪识别引擎

        Args:
            bert_classifier: 可选的BERT分类器实例
        """
        self.bert_classifier = bert_classifier
        self.llm_service = get_llm_service()

    def _keyword_analysis(self, text: str) -> Dict[str, Any]:
        """
        关键词分析 - 第一层

        Args:
            text: 用户输入文本

        Returns:
            关键词分析结果
        """
        scores = {}
        matched_keywords = {}

        for emotion, keywords in self.EMOTION_KEYWORDS.items():
            matches = [kw for kw in keywords if kw in text]
            if matches:
                # 计算匹配分数：匹配关键词数量 * 关键词长度权重
                score = sum(len(kw) for kw in matches) / max(len(text), 1)
                scores[emotion] = min(score * 10, 1.0)  # 归一化
                matched_keywords[emotion] = matches

        if not scores:
            scores["neutral"] = 0.5
            matched_keywords["neutral"] = []

        # 找到最高分的情绪
        if scores:
            primary_emotion = max(scores, key=scores.get)
            confidence = scores[primary_emotion]
        else:
            primary_emotion = "neutral"
            confidence = 0.5

        return {
            "emotion": primary_emotion,
            "confidence": confidence,
            "all_scores": scores,
            "matched_keywords": matched_keywords
        }

    def _bert_analysis(self, text: str) -> Optional[Dict[str, Any]]:
        """
        BERT模型分析 - 第二层（可选）

        Args:
            text: 用户输入文本

        Returns:
            BERT分析结果，如果模型不可用则返回None
        """
        if self.bert_classifier is None:
            return None

        try:
            result = self.bert_classifier.predict(text)
            return {
                "emotion": result.get("emotion", "neutral"),
                "confidence": result.get("confidence", 0.0),
                "all_scores": result.get("all_scores", {})
            }
        except Exception as e:
            logger.warning(f"BERT分析失败: {e}")
            return None

    async def _llm_analysis(
        self,
        text: str,
        keyword_result: Dict[str, Any],
        bert_result: Optional[Dict[str, Any]],
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        LLM语义分析 - 第三层（最终仲裁）

        Args:
            text: 用户输入文本
            keyword_result: 关键词分析结果
            bert_result: BERT分析结果（可选）
            context: 上下文信息

        Returns:
            LLM分析结果
        """
        # 构建分析提示词
        system_prompt = """你是一位善于共情的情绪分析专家。请从用户的话语中理解他们真实的情绪状态。

分析要点：
1. 用户字面表达的情绪
2. 用户隐含的情绪（如"我好累"可能暗示沮丧、挫败或无助）
3. 情绪的强度和紧迫程度
4. 结合对话背景理解上下文

请以JSON格式返回（只返回JSON，不要其他内容）：
{
  "primary_emotion": "主要情绪（从：joy/sadness/anger/fear/anxiety/frustration/loneliness/shame/guilt/pride/hope/surprise/confusion/calm/neutral中选择）",
  "intensity": 情绪强度(0-1之间的数值),
  "confidence": 分析置信度(0-1之间的数值),
  "reasoning": "简短分析理由",
  "suggested_response_tone": "建议回应语调"
}"""

        # 构建上下文提示
        context_parts = [f"用户说："{text}""]

        # 添加关键词分析参考
        if keyword_result.get("matched_keywords"):
            matched = keyword_result["matched_keywords"]
            context_parts.append(f"\n[关键词分析参考] 检测到关键词：{matched}")

        # 添加BERT分析参考
        if bert_result and bert_result.get("confidence", 0) > 0.3:
            context_parts.append(f"[BERT模型参考] 倾向于：{bert_result['emotion']}（置信度：{bert_result['confidence']:.2f}）")

        # 添加对话历史
        if context and context.get("conversation_history"):
            recent = context["conversation_history"][-3:]
            history_str = "\n".join([f"{h.get('role', 'user')}: {h.get('content', '')}" for h in recent])
            context_parts.append(f"\n[对话背景]\n{history_str}")

        prompt = "\n".join(context_parts)

        try:
            result = await self.llm_service.generate(
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=0.3,
                max_tokens=300
            )

            # 解析JSON结果
            result = result.strip()
            if result.startswith("```json"):
                result = result[7:]
            if result.startswith("```"):
                result = result[3:]
            if result.endswith("```"):
                result = result[:-3]

            parsed = json.loads(result)
            return {
                "emotion": parsed.get("primary_emotion", "neutral"),
                "intensity": parsed.get("intensity", 0.5),
                "confidence": parsed.get("confidence", 0.5),
                "reasoning": parsed.get("reasoning", ""),
                "suggested_tone": parsed.get("suggested_response_tone", "温暖")
            }

        except Exception as e:
            logger.warning(f"LLM分析失败: {e}，使用关键词结果")
            # 降级到关键词结果
            return {
                "emotion": keyword_result.get("emotion", "neutral"),
                "intensity": keyword_result.get("confidence", 0.5),
                "confidence": keyword_result.get("confidence", 0.5),
                "reasoning": "基于关键词分析",
                "suggested_tone": "温暖"
            }

    def _merge_results(
        self,
        keyword_result: Dict[str, Any],
        bert_result: Optional[Dict[str, Any]],
        llm_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        融合三层结果

        决策逻辑：
        1. LLM结果作为主要依据（权重最高）
        2. 关键词结果作为补充验证
        3. BERT结果作为参考（如果可用）

        Args:
            keyword_result: 关键词分析结果
            bert_result: BERT分析结果
            llm_result: LLM分析结果

        Returns:
            融合后的最终结果
        """
        # 以LLM结果为主
        final_emotion = llm_result.get("emotion", "neutral")
        final_confidence = llm_result.get("confidence", 0.5)
        final_intensity = llm_result.get("intensity", 0.5)

        # 如果关键词和LLM结果一致，提升置信度
        if keyword_result.get("emotion") == final_emotion:
            final_confidence = min(final_confidence + 0.1, 1.0)

        # 如果BERT结果一致，再提升置信度
        if bert_result and bert_result.get("emotion") == final_emotion:
            final_confidence = min(final_confidence + 0.05, 1.0)

        return {
            "emotion": final_emotion,
            "emotion_cn": self.EMOTION_CN.get(final_emotion, final_emotion),
            "intensity": final_intensity,
            "confidence": final_confidence,
            "reasoning": llm_result.get("reasoning", ""),
            "suggested_tone": llm_result.get("suggested_tone", "温暖"),
            "weight": self.EMOTION_WEIGHTS.get(final_emotion, 0.3),
            "all_scores": keyword_result.get("all_scores", {}),
            "matched_keywords": keyword_result.get("matched_keywords", {})
        }

    async def analyze(
        self,
        text: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        执行三层融合情绪分析

        Args:
            text: 用户输入文本
            context: 上下文信息（包含对话历史等）

        Returns:
            完整的情绪分析结果
        """
        # 第一层：关键词快速分析
        keyword_result = self._keyword_analysis(text)

        # 第二层：BERT分析（可选）
        bert_result = self._bert_analysis(text)

        # 第三层：LLM语义分析（仲裁）
        llm_result = await self._llm_analysis(text, keyword_result, bert_result, context)

        # 融合结果
        final_result = self._merge_results(keyword_result, bert_result, llm_result)

        # 添加元数据
        final_result["text"] = text
        final_result["layers"] = {
            "keyword": keyword_result,
            "bert": bert_result,
            "llm": llm_result
        }

        return final_result

    def get_risk_level(self, emotion: str, intensity: float) -> str:
        """
        根据情绪和强度判断风险等级

        Args:
            emotion: 情绪类型
            intensity: 情绪强度

        Returns:
            风险等级 (green/yellow/orange/red)
        """
        # 高风险情绪
        high_risk_emotions = {"fear", "anger", "anxiety"}
        medium_risk_emotions = {"sadness", "loneliness", "shame", "guilt", "frustration"}

        if emotion in high_risk_emotions:
            if intensity >= 0.8:
                return "red"
            elif intensity >= 0.6:
                return "orange"
            elif intensity >= 0.4:
                return "yellow"

        if emotion in medium_risk_emotions:
            if intensity >= 0.8:
                return "orange"
            elif intensity >= 0.6:
                return "yellow"

        return "green"


# 全局单例
_hybrid_engine: Optional[HybridEmotionEngine] = None


def get_hybrid_engine(bert_classifier=None) -> HybridEmotionEngine:
    """获取混合情绪识别引擎单例"""
    global _hybrid_engine
    if _hybrid_engine is None:
        _hybrid_engine = HybridEmotionEngine(bert_classifier=bert_classifier)
    return _hybrid_engine
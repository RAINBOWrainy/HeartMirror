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

# 延迟导入LLM服务，避免启动时加载重型依赖
# from app.services.llm_service import get_llm_service

logger = logging.getLogger(__name__)


class HybridEmotionEngine:
    """
    混合情绪识别引擎

    采用三层融合架构，以LLM语义分析为核心，
    结合关键词匹配和BERT分类（可选）提供准确的情绪识别
    """

    # 扩展的情绪关键词库 - 分层结构，支持口语化表达
    EMOTION_KEYWORDS = {
        "joy": {
            "strong": ["太棒了", "超级开心", "开心死了", "笑死我了", "乐翻天", "美上天了"],
            "moderate": ["开心", "快乐", "高兴", "幸福", "哈哈", "嘻嘻", "棒", "太好了"],
            "mild": ["还行", "不错", "挺好", "还可以"],
            "colloquial": ["美滋滋", "爽", "舒服", "奈斯", "nice", "666", "绝了"]
        },
        "sadness": {
            "strong": ["特别难过", "心痛死了", "绝望", "生不如死", "崩溃", "痛不欲生"],
            "moderate": ["难过", "伤心", "悲伤", "沮丧", "失落", "哭", "难受", "郁闷", "失眠", "睡不着"],
            "mild": ["有点难过", "不太开心", "闷闷的", "睡不好"],
            "colloquial": ["emo了", "破防了", "心塞", "扎心", "泪目"]
        },
        "anger": {
            "strong": ["气死我了", "暴怒", "火冒三丈", "忍无可忍", "气炸了"],
            "moderate": ["生气", "愤怒", "恼火", "烦死了", "气人", "讨厌"],
            "mild": ["有点气", "不太爽", "无语"],
            "colloquial": ["无语死了", "服了", "心态崩了", "烦", "气抖冷"]
        },
        "fear": {
            "strong": ["特别害怕", "恐惧死了", "吓死了", "惊恐"],
            "moderate": ["害怕", "恐惧", "担心", "紧张", "不安", "怕"],
            "mild": ["有点怕", "不太踏实", "心里没底"],
            "colloquial": ["慌得一批", "吓人", "害怕极了"]
        },
        "anxiety": {
            "strong": ["特别焦虑", "焦虑死了", "恐慌发作", "崩溃边缘"],
            "moderate": ["焦虑", "烦躁", "紧张", "坐立不安", "心慌", "压力"],
            "mild": ["有点紧张", "不太踏实", "心里没底"],
            "colloquial": ["心慌慌", "慌得一批", "压力山大", "卷死了", "焦虑ing"]
        },
        "frustration": {
            "strong": ["累死了", "心力交瘁", "筋疲力尽", "精疲力竭", "不想活了", "崩溃"],
            "moderate": ["好累", "心累", "疲惫", "无力", "没劲", "提不起劲"],
            "mild": ["有点累", "不太有精神", "一般般"],
            "colloquial": ["摆烂了", "躺平", "佛了", "累觉不爱", "麻了", "emo"],
            # 特别注意：区分物理疲劳和情绪疲劳
            "context_rules": {
                "physical_tired": ["运动", "健身", "走路", "干活", "搬砖", "加班后"],
                "emotional_tired": ["心累", "精神", "真的累", "太累了", "心力交瘁"]
            }
        },
        "loneliness": {
            "strong": ["特别孤独", "孤独死了", "没人爱我", "被遗弃", "与世隔绝"],
            "moderate": ["孤独", "寂寞", "孤单", "没人理解", "一个人"],
            "mild": ["有点孤单", "没人说话"],
            "colloquial": ["社恐", "自闭了", "透明人", "小透明", "孤寡"]
        },
        "shame": {
            "strong": ["羞耻死了", "无地自容", "丢死人了"],
            "moderate": ["羞耻", "丢脸", "尴尬", "不好意思", "羞愧"],
            "mild": ["有点尴尬", "不太好意思"],
            "colloquial": ["社死", "想找个地缝钻进去", "尴尬死了"]
        },
        "guilt": {
            "strong": ["特别内疚", "愧疚死了", "良心不安"],
            "moderate": ["内疚", "愧疚", "自责", "过意不去"],
            "mild": ["有点过意不去"],
            "colloquial": ["心里过意不去", "感觉不太好"]
        },
        "pride": {
            "strong": ["太自豪了", "超级骄傲", "骄傲死了"],
            "moderate": ["自豪", "骄傲", "成就感", "得意"],
            "mild": ["还行吧", "还可以"],
            "colloquial": ["牛逼", "厉害了", "666", "起飞"]
        },
        "hope": {
            "strong": ["充满希望", "特别期待", "超级憧憬"],
            "moderate": ["希望", "期待", "向往", "憧憬", "梦想"],
            "mild": ["有点期待"],
            "colloquial": ["冲", "期待ing", "有奔头"]
        },
        "surprise": {
            "strong": ["震惊", "惊呆了", "难以置信"],
            "moderate": ["惊讶", "意外", "没想到", "居然"],
            "mild": ["有点意外"],
            "colloquial": ["卧槽", "我去", "天哪", "不会吧", "离谱"]
        },
        "confusion": {
            "strong": ["完全搞不懂", "一头雾水", "彻底糊涂"],
            "moderate": ["困惑", "迷茫", "不解", "搞不懂", "糊涂"],
            "mild": ["有点迷糊", "不太清楚"],
            "colloquial": ["懵了", "一脸懵", "蒙圈", "搞不懂"]
        },
        "calm": {
            "strong": ["特别平静", "心如止水"],
            "moderate": ["平静", "安宁", "放松", "轻松"],
            "mild": ["还行", "还好"],
            "colloquial": ["佛系", "淡定", "稳"]
        },
        "neutral": {
            "strong": [],
            "moderate": [],
            "mild": ["一般", "还行", "普通", "没什么", "正常", "还可以"],
            "colloquial": []
        }
    }

    # 否定词列表（用于检测否定语境）
    NEGATION_WORDS = ["不", "没", "无", "不会", "没有", "不是", "不再", "别", "莫"]

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
        self._llm_service = None  # 延迟加载

    @property
    def llm_service(self):
        """延迟加载LLM服务"""
        if self._llm_service is None:
            from app.services.llm_service import get_llm_service
            self._llm_service = get_llm_service()
        return self._llm_service

    def _keyword_analysis(self, text: str) -> Dict[str, Any]:
        """
        关键词分析 - 第一层（增强版：支持分层词库和否定检测）

        Args:
            text: 用户输入文本

        Returns:
            关键词分析结果
        """
        scores = {}
        matched_keywords = {}
        text_lower = text.lower()

        def has_negation(text: str, keyword: str) -> bool:
            """检查关键词前是否有否定词"""
            idx = text.find(keyword)
            if idx == -1:
                return False
            prefix = text[max(0, idx-5):idx]
            return any(neg in prefix for neg in self.NEGATION_WORDS)

        for emotion, keyword_sets in self.EMOTION_KEYWORDS.items():
            if isinstance(keyword_sets, dict):
                # 新的分层词库结构
                emotion_score = 0
                matched = []

                # 强程度词（权重3）
                for kw in keyword_sets.get("strong", []):
                    if kw in text and not has_negation(text, kw):
                        emotion_score += 3
                        matched.append(kw)

                # 中等程度词（权重2）
                for kw in keyword_sets.get("moderate", []):
                    if kw in text and not has_negation(text, kw):
                        emotion_score += 2
                        matched.append(kw)

                # 轻微程度词（权重1）
                for kw in keyword_sets.get("mild", []):
                    if kw in text and not has_negation(text, kw):
                        emotion_score += 1
                        matched.append(kw)

                # 口语化/网络用语（权重1.5）
                for kw in keyword_sets.get("colloquial", []):
                    if kw.lower() in text_lower and not has_negation(text, kw):
                        emotion_score += 1.5
                        matched.append(kw)

                # 特殊处理：frustration 的上下文规则
                if emotion == "frustration" and emotion_score > 0:
                    context_rules = keyword_sets.get("context_rules", {})
                    physical_indicators = context_rules.get("physical_tired", [])
                    emotional_indicators = context_rules.get("emotional_tired", [])

                    is_physical = any(ind in text for ind in physical_indicators)
                    is_emotional = any(ind in text for ind in emotional_indicators)

                    # 如果只是物理疲劳，降低情绪权重
                    if is_physical and not is_emotional:
                        emotion_score *= 0.3

                if matched:
                    scores[emotion] = min(emotion_score / 5, 1.0)
                    matched_keywords[emotion] = matched
            else:
                # 兼容旧的列表结构
                matches = [kw for kw in keyword_sets if kw in text and not has_negation(text, kw)]
                if matches:
                    score = sum(len(kw) for kw in matches) / max(len(text), 1)
                    scores[emotion] = min(score * 10, 1.0)
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
        context_parts = [f'用户说："{text}"']

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
    """获取混合情绪识别引擎单例（自动加载BERT分类器）"""
    global _hybrid_engine
    if _hybrid_engine is None:
        # 如果没有传入 bert_classifier，尝试自动加载
        if bert_classifier is None:
            try:
                from app.agents.emotion_agent.bert_classifier import EmotionBERTClassifier
                bert_classifier = EmotionBERTClassifier()
                logger.info("BERT classifier loaded successfully")
            except Exception as e:
                logger.warning(f"Failed to load BERT classifier: {e}, using keyword-only mode")
                bert_classifier = None
        _hybrid_engine = HybridEmotionEngine(bert_classifier=bert_classifier)
    return _hybrid_engine
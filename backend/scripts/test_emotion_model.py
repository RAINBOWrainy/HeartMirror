"""
Make sample predictions with Emotion BERT
情绪BERT模型示例预测
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.agents.emotion_agent.bert_classifier import EmotionBERTClassifier


def main():
    """测试情绪分类器"""
    print("=" * 50)
    print("情绪识别模型测试")
    print("=" * 50)

    # 初始化分类器
    print("\n正在加载模型...")
    classifier = EmotionBERTClassifier()
    print("模型加载完成！")

    # 测试文本
    test_texts = [
        "今天天气真好，心情很愉快！",
        "最近工作压力很大，感觉很累。",
        "我对未来感到很担忧，不知道该怎么办。",
        "这个消息太让我震惊了！",
        "今天一切都很平常。"
    ]

    print("\n" + "-" * 50)
    print("测试结果：")
    print("-" * 50)

    for text in test_texts:
        result = classifier.predict(text)
        print(f"\n文本: {text}")
        print(f"情绪: {result['emotion']}")
        print(f"强度: {result['intensity']:.2f}")
        print(f"置信度: {result['confidence']:.2%}")

    print("\n" + "=" * 50)


if __name__ == "__main__":
    main()
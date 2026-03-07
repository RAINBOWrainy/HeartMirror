"""
Test OpenRouter API Connection
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.llm_service import LLMService


async def test_openrouter_connection():
    """Test OpenRouter API connection"""
    print("=" * 60)
    print("OpenRouter API Connection Test")
    print("=" * 60)

    # Use environment variable or empty string (will use settings.OPENROUTER_API_KEY)
    api_key = os.environ.get("OPENROUTER_API_KEY", "")

    service = LLMService(
        api_key=api_key if api_key else None,  # None will use settings default
        base_url=os.environ.get("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
        model=os.environ.get("LLM_MODEL", "arcee-ai/trinity-large-preview:free")
    )

    print(f"\nConfig:")
    print(f"  Base URL: {service.base_url}")
    print(f"  Model: {service.model}")
    print(f"  API Key: {'*' * 20 if service.api_key else 'Not set'}")

    # Test 1: Basic text generation
    print("\n" + "-" * 40)
    print("Test 1: Basic text generation")
    print("-" * 40)

    try:
        response = await service.generate(
            prompt="Hello, please introduce yourself in one sentence.",
            system_prompt="You are a friendly AI assistant.",
            temperature=0.7,
            max_tokens=100
        )
        print(f"[OK] Response: {response[:100]}...")
    except Exception as e:
        print(f"[FAIL] Error: {e}")

    # Test 2: Emotion analysis
    print("\n" + "-" * 40)
    print("Test 2: Emotion analysis")
    print("-" * 40)

    try:
        result = await service.analyze_emotion("I feel tired and stressed today")
        print(f"[OK] Emotion analysis:")
        print(f"   Primary emotion: {result.get('primary_emotion')}")
        print(f"   Intensity: {result.get('intensity')}")
        print(f"   Confidence: {result.get('confidence')}")
    except Exception as e:
        print(f"[FAIL] Error: {e}")

    # Test 3: Chat response
    print("\n" + "-" * 40)
    print("Test 3: Chat response")
    print("-" * 40)

    try:
        response = await service.generate_chat_response(
            user_input="I've been feeling stressed lately",
            conversation_history=[],
            emotion_detected="anxiety",
            risk_level="yellow"
        )
        print(f"[OK] Chat response: {response[:150]}...")
    except Exception as e:
        print(f"[FAIL] Error: {e}")

    print("\n" + "=" * 60)
    print("Test completed")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(test_openrouter_connection())
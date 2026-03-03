"""
Validators
数据验证工具
"""
import re
from typing import Tuple


def validate_anonymous_id(anonymous_id: str) -> Tuple[bool, str]:
    """
    验证匿名ID

    Args:
        anonymous_id: 匿名ID

    Returns:
        (是否有效, 错误信息)
    """
    if not anonymous_id:
        return False, "匿名ID不能为空"

    if len(anonymous_id) < 3:
        return False, "匿名ID至少3个字符"

    if len(anonymous_id) > 50:
        return False, "匿名ID最多50个字符"

    # 只允许中文、字母、数字、下划线
    if not re.match(r'^[\u4e00-\u9fa5a-zA-Z0-9_]+$', anonymous_id):
        return False, "匿名ID只能包含中文、字母、数字和下划线"

    return True, ""


def validate_password(password: str) -> Tuple[bool, str]:
    """
    验证密码

    Args:
        password: 密码

    Returns:
        (是否有效, 错误信息)
    """
    if not password:
        return False, "密码不能为空"

    if len(password) < 6:
        return False, "密码至少6个字符"

    if len(password) > 100:
        return False, "密码最多100个字符"

    return True, ""


def validate_emotion_intensity(intensity: float) -> Tuple[bool, str]:
    """
    验证情绪强度

    Args:
        intensity: 情绪强度

    Returns:
        (是否有效, 错误信息)
    """
    if not isinstance(intensity, (int, float)):
        return False, "情绪强度必须是数字"

    if intensity < 0 or intensity > 1:
        return False, "情绪强度必须在0-1之间"

    return True, ""


def sanitize_text(text: str) -> str:
    """
    清理文本输入

    Args:
        text: 输入文本

    Returns:
        清理后的文本
    """
    if not text:
        return ""

    # 移除首尾空白
    text = text.strip()

    # 移除危险字符
    text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r'<[^>]+>', '', text)

    return text
"""
Custom Exceptions
自定义异常类
"""
from fastapi import HTTPException, status


class HeartMirrorException(Exception):
    """HeartMirror基础异常"""

    def __init__(self, message: str, code: str = "UNKNOWN_ERROR"):
        self.message = message
        self.code = code
        super().__init__(self.message)


class AuthenticationError(HeartMirrorException):
    """认证错误"""

    def __init__(self, message: str = "认证失败"):
        super().__init__(message, "AUTHENTICATION_ERROR")


class AuthorizationError(HeartMirrorException):
    """授权错误"""

    def __init__(self, message: str = "权限不足"):
        super().__init__(message, "AUTHORIZATION_ERROR")


class UserNotFoundError(HeartMirrorException):
    """用户不存在"""

    def __init__(self, message: str = "用户不存在"):
        super().__init__(message, "USER_NOT_FOUND")


class SessionNotFoundError(HeartMirrorException):
    """会话不存在"""

    def __init__(self, message: str = "会话不存在或已过期"):
        super().__init__(message, "SESSION_NOT_FOUND")


class CrisisDetectedError(HeartMirrorException):
    """危机风险检测"""

    def __init__(self, message: str = "检测到高风险情绪状态", risk_level: str = "high"):
        self.risk_level = risk_level
        super().__init__(message, "CRISIS_DETECTED")


class AgentError(HeartMirrorException):
    """Agent处理错误"""

    def __init__(self, message: str, agent_name: str = ""):
        self.agent_name = agent_name
        super().__init__(message, f"AGENT_ERROR_{agent_name.upper()}")


class LLMError(HeartMirrorException):
    """LLM调用错误"""

    def __init__(self, message: str = "LLM服务暂时不可用"):
        super().__init__(message, "LLM_ERROR")


class KnowledgeBaseError(HeartMirrorException):
    """知识库错误"""

    def __init__(self, message: str = "知识库查询失败"):
        super().__init__(message, "KNOWLEDGE_BASE_ERROR")


def http_exception_from_error(error: HeartMirrorException) -> HTTPException:
    """将自定义异常转换为HTTP异常"""
    status_map = {
        "AUTHENTICATION_ERROR": status.HTTP_401_UNAUTHORIZED,
        "AUTHORIZATION_ERROR": status.HTTP_403_FORBIDDEN,
        "USER_NOT_FOUND": status.HTTP_404_NOT_FOUND,
        "SESSION_NOT_FOUND": status.HTTP_404_NOT_FOUND,
        "CRISIS_DETECTED": status.HTTP_200_OK,  # 危机检测不返回错误状态码
        "AGENT_ERROR": status.HTTP_500_INTERNAL_SERVER_ERROR,
        "LLM_ERROR": status.HTTP_503_SERVICE_UNAVAILABLE,
        "KNOWLEDGE_BASE_ERROR": status.HTTP_500_INTERNAL_SERVER_ERROR,
    }

    return HTTPException(
        status_code=status_map.get(error.code, status.HTTP_500_INTERNAL_SERVER_ERROR),
        detail={"message": error.message, "code": error.code}
    )
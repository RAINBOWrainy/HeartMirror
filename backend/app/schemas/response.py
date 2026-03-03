"""
Response Schemas
通用响应模型
"""
from typing import Any, Generic, Optional, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    """通用API响应Schema"""
    success: bool = True
    message: str = "操作成功"
    data: Optional[T] = None
    error: Optional[str] = None


class PaginatedResponse(BaseModel, Generic[T]):
    """分页响应Schema"""
    items: list[T]
    total: int
    page: int
    page_size: int
    pages: int


class ErrorResponse(BaseModel):
    """错误响应Schema"""
    success: bool = False
    message: str
    error_code: Optional[str] = None
    details: Optional[dict] = None
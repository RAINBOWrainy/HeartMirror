"""
Redis Client Configuration
"""
import json
from typing import Any, Optional

import redis.asyncio as redis

from app.config import settings


class RedisClient:
    """Redis异步客户端封装"""

    def __init__(self, url: str):
        self.url = url
        self.client: Optional[redis.Redis] = None

    async def connect(self):
        """建立Redis连接"""
        self.client = redis.from_url(
            self.url,
            encoding="utf-8",
            decode_responses=True
        )

    async def disconnect(self):
        """关闭Redis连接"""
        if self.client:
            await self.client.close()

    async def get(self, key: str) -> Optional[str]:
        """获取值"""
        if not self.client:
            return None
        return await self.client.get(key)

    async def set(
        self,
        key: str,
        value: str,
        expire: Optional[int] = None
    ) -> bool:
        """设置值"""
        if not self.client:
            return False
        if expire:
            await self.client.setex(key, expire, value)
        else:
            await self.client.set(key, value)
        return True

    async def delete(self, key: str) -> bool:
        """删除键"""
        if not self.client:
            return False
        await self.client.delete(key)
        return True

    async def set_json(
        self,
        key: str,
        value: Any,
        expire: Optional[int] = None
    ) -> bool:
        """存储JSON对象"""
        return await self.set(key, json.dumps(value), expire)

    async def get_json(self, key: str) -> Optional[Any]:
        """获取JSON对象"""
        value = await self.get(key)
        if value:
            return json.loads(value)
        return None

    async def lpush(self, key: str, value: str) -> int:
        """列表左侧插入"""
        if not self.client:
            return 0
        return await self.client.lpush(key, value)

    async def rpush(self, key: str, value: str) -> int:
        """列表右侧插入"""
        if not self.client:
            return 0
        return await self.client.rpush(key, value)

    async def lrange(self, key: str, start: int, end: int) -> list:
        """获取列表范围"""
        if not self.client:
            return []
        return await self.client.lrange(key, start, end)


# 全局Redis客户端
redis_client = RedisClient(settings.REDIS_URL)


async def init_redis():
    """初始化Redis连接"""
    # 检查 Redis URL 是否有效
    url = settings.REDIS_URL
    if not url or not any(url.startswith(scheme) for scheme in ['redis://', 'rediss://', 'unix://']):
        print("⚠️ Redis URL not configured or invalid, skipping Redis initialization")
        redis_client.client = None
        return

    try:
        await redis_client.connect()
    except Exception as e:
        print(f"⚠️ Redis connection failed: {e}")
        redis_client.client = None


async def close_redis():
    """关闭Redis连接"""
    await redis_client.disconnect()
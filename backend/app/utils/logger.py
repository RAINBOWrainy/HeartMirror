"""
Logger Configuration
日志配置模块
"""
import sys
from loguru import logger


def setup_logger(log_level: str = "INFO", log_file: str = None):
    """
    配置日志

    Args:
        log_level: 日志级别
        log_file: 日志文件路径
    """
    # 移除默认处理器
    logger.remove()

    # 控制台输出
    logger.add(
        sys.stdout,
        level=log_level,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>"
    )

    # 文件输出
    if log_file:
        logger.add(
            log_file,
            level=log_level,
            rotation="10 MB",
            retention="7 days",
            format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}"
        )

    return logger


def get_logger(name: str = "heartmirror"):
    """
    获取日志实例

    Args:
        name: 日志名称

    Returns:
        logger实例
    """
    return logger.bind(name=name)


# 默认配置
setup_logger()
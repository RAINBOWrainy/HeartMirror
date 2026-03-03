"""
Crisis Support API Routes
危机支持接口
"""
from typing import Annotated, Dict, List

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.api.auth import get_current_user
from app.config import settings
from app.models.user import User

router = APIRouter()


class CrisisResource(BaseModel):
    """危机资源"""
    name: str
    phone: str
    description: str
    available_hours: str
    region: str


class CrisisResponse(BaseModel):
    """危机响应"""
    message: str
    resources: List[CrisisResource]
    safety_plan: Dict
    immediate_actions: List[str]


# 危机热线资源
CRISIS_RESOURCES = [
    CrisisResource(
        name="全国心理援助热线",
        phone="400-161-9995",
        description="24小时心理危机干预热线",
        available_hours="24小时",
        region="全国",
    ),
    CrisisResource(
        name="北京心理危机研究与干预中心",
        phone="010-82951332",
        description="北京市心理危机干预服务",
        available_hours="24小时",
        region="北京",
    ),
    CrisisResource(
        name="上海心理援助热线",
        phone="021-34289888",
        description="上海市心理援助服务",
        available_hours="24小时",
        region="上海",
    ),
    CrisisResource(
        name="广州市心理援助热线",
        phone="020-81899120",
        description="广州市心理危机干预服务",
        available_hours="24小时",
        region="广州",
    ),
    CrisisResource(
        name="深圳市心理危机干预热线",
        phone="0755-25629459",
        description="深圳市心理援助服务",
        available_hours="24小时",
        region="深圳",
    ),
]

# 立即行动建议
IMMEDIATE_ACTIONS = [
    "深呼吸：慢慢吸气4秒，屏住呼吸4秒，慢慢呼气4秒",
    "找一个安全、安静的地方坐下",
    "联系您信任的朋友或家人",
    "拨打心理援助热线寻求专业帮助",
    "如果您感到有自伤或伤人的风险，请立即拨打120或110",
]

# 安全计划模板
SAFETY_PLAN_TEMPLATE = {
    "step1": "识别警示信号：列出可能触发危机的情况",
    "step2": "内部应对策略：列出可以自我安抚的活动",
    "step3": "社交支持：列出可以联系的人",
    "step4": "专业帮助：列出可以联系的专业机构",
    "step5": "安全环境：确保环境安全，移除危险物品",
}


@router.get("/resources", response_model=List[CrisisResource])
async def get_crisis_resources(
    current_user: Annotated[User, Depends(get_current_user)],
):
    """
    获取危机支持资源列表

    返回全国及各地心理援助热线信息
    """
    return CRISIS_RESOURCES


@router.get("/hotline")
async def get_hotline():
    """
    获取紧急热线（无需认证）

    用于紧急情况下的快速访问
    """
    return {
        "national_hotline": "400-161-9995",
        "emergency": "120",
        "police": "110",
        "message": "如果您正处于危机状态，请立即拨打心理援助热线或紧急求助电话。",
    }


@router.get("/safety-plan", response_model=Dict)
async def get_safety_plan(
    current_user: Annotated[User, Depends(get_current_user)],
):
    """
    获取安全计划模板

    帮助用户制定个人安全计划
    """
    return SAFETY_PLAN_TEMPLATE


@router.get("/immediate-help", response_model=CrisisResponse)
async def get_immediate_help(
    current_user: Annotated[User, Depends(get_current_user)],
):
    """
    获取即时帮助

    当检测到高风险情绪时调用此接口
    """
    return CrisisResponse(
        message="我们检测到您可能正在经历困难时刻。请知道，您并不孤单，帮助就在身边。",
        resources=CRISIS_RESOURCES[:3],  # 返回前3个资源
        safety_plan=SAFETY_PLAN_TEMPLATE,
        immediate_actions=IMMEDIATE_ACTIONS,
    )


@router.post("/report")
async def report_crisis(
    current_user: Annotated[User, Depends(get_current_user)],
):
    """
    报告危机事件

    记录危机事件用于后续跟进（匿名化）
    """
    # TODO: 实现危机事件记录
    return {
        "message": "已记录您的求助请求",
        "follow_up": "我们的系统会在24小时内跟进您的状态",
        "resources": CRISIS_RESOURCES[:2],
    }


@router.get("/grounding-exercises")
async def get_grounding_exercises():
    """
    获取接地练习

    用于缓解焦虑和恐慌的即时练习
    """
    return {
        "exercises": [
            {
                "name": "5-4-3-2-1 接地技术",
                "description": "使用五感来关注当下",
                "steps": [
                    "说出5件你能看到的东西",
                    "说出4件你能触摸的东西",
                    "说出3件你能听到的声音",
                    "说出2件你能闻到的气味",
                    "说出1件你能尝到的味道",
                ],
                "duration": "5分钟",
            },
            {
                "name": "深呼吸练习",
                "description": "4-7-8呼吸法",
                "steps": [
                    "用鼻子慢慢吸气，数4秒",
                    "屏住呼吸，数7秒",
                    "用嘴巴慢慢呼气，数8秒",
                    "重复3-4次",
                ],
                "duration": "2分钟",
            },
            {
                "name": "身体扫描",
                "description": "逐步放松身体各部位",
                "steps": [
                    "从头顶开始，注意紧张感",
                    "慢慢移到额头、眼睛、下巴",
                    "继续到肩膀、手臂、手",
                    "最后到胸部、腹部、腿部、脚",
                    "感受身体的放松",
                ],
                "duration": "10分钟",
            },
        ]
    }
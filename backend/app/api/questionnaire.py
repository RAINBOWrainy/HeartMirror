"""
Questionnaire API Routes
问卷评估接口 - 支持PHQ-9, GAD-7, DASS-21等专业量表
"""
import uuid
from datetime import datetime, timezone
from typing import Annotated, List, Optional, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.dependencies import get_db
from app.models.user import User
from app.models.questionnaire import QuestionnaireSession, QuestionnaireAnswer, QuestionnaireType
from app.core.security import encrypt_data, decrypt_data


router = APIRouter()


# ===== 问卷定义 =====

QUESTIONNAIRE_DEFINITIONS = {
    "phq9": {
        "name": "PHQ-9 抑郁筛查量表",
        "description": "用于筛查抑郁症状的专业量表，共9道题",
        "type": QuestionnaireType.PHQ9,
        "questions": [
            "过去两周内，你对做事情是否缺乏兴趣或乐趣？",
            "过去两周内，你是否感到情绪低落、沮丧或绝望？",
            "过去两周内，你是否有入睡困难、睡眠质量差或睡眠过多？",
            "过去两周内，你是否感到疲倦或没有精力？",
            "过去两周内，你是否食欲不振或暴饮暴食？",
            "过去两周内，你是否对自己感到不满，觉得自己是个失败者？",
            "过去两周内，你是否难以集中注意力，比如看电视或看书时？",
            "过去两周内，你是否动作或说话缓慢，或相反——变得烦躁不安？",
            "过去两周内，你是否有想要伤害自己或结束生命的想法？"
        ],
        "options": [
            {"value": 0, "label": "完全没有"},
            {"value": 1, "label": "有几天"},
            {"value": 2, "label": "超过一半的天数"},
            {"value": 3, "label": "几乎每天"}
        ],
        "scoring": {
            "minimal": {"max": 4, "label": "极轻微", "description": "暂无需治疗"},
            "mild": {"max": 9, "label": "轻度", "description": "建议观察随访"},
            "moderate": {"max": 14, "label": "中度", "description": "建议寻求专业帮助"},
            "moderately_severe": {"max": 19, "label": "中重度", "description": "建议尽快寻求专业帮助"},
            "severe": {"max": 27, "label": "重度", "description": "建议立即寻求专业帮助"}
        }
    },
    "gad7": {
        "name": "GAD-7 焦虑筛查量表",
        "description": "用于筛查焦虑症状的专业量表，共7道题",
        "type": QuestionnaireType.GAD7,
        "questions": [
            "过去两周内，你是否感到紧张、焦虑或坐立不安？",
            "过去两周内，你是否无法控制或停止担忧？",
            "过去两周内，你是否对各种事情过度担忧？",
            "过去两周内，你是否难以放松？",
            "过去两周内，你是否感到坐立不安，很难静下来？",
            "过去两周内，你是否容易烦躁或易怒？",
            "过去两周内，你是否感到害怕，好像有什么可怕的事情会发生？"
        ],
        "options": [
            {"value": 0, "label": "完全没有"},
            {"value": 1, "label": "有几天"},
            {"value": 2, "label": "超过一半的天数"},
            {"value": 3, "label": "几乎每天"}
        ],
        "scoring": {
            "minimal": {"max": 4, "label": "极轻微", "description": "暂无需治疗"},
            "mild": {"max": 9, "label": "轻度", "description": "建议观察随访"},
            "moderate": {"max": 14, "label": "中度", "description": "建议寻求专业帮助"},
            "severe": {"max": 21, "label": "重度", "description": "建议尽快寻求专业帮助"}
        }
    },
    "dass21": {
        "name": "DASS-21 抑郁焦虑压力量表",
        "description": "综合评估抑郁、焦虑和压力症状的量表，共21道题",
        "type": QuestionnaireType.DASS21,
        "questions": [
            # 抑郁维度 (D)
            "过去一周内，我感到情绪低落",
            "过去一周内，我感到未来没有希望",
            "过去一周内，我感到自己毫无价值",
            "过去一周内，我感到生活没有意义",
            "过去一周内，我很难对任何事情产生兴趣",
            "过去一周内，我无法感受到任何快乐",
            "过去一周内，我感到自己很失败",
            # 焦虑维度 (A)
            "过去一周内，我感到口干舌燥",
            "过去一周内，我体验到呼吸困难的症状",
            "过去一周内，我感到颤抖",
            "过去一周内，我担心自己可能会惊慌失措",
            "过去一周内，我感到快要崩溃",
            "过去一周内，我很难放松",
            "过去一周内，我注意到自己出汗增多",
            # 压力维度 (S)
            "过去一周内，我发现自己很难安静下来",
            "过去一周内，我容易因为小事发火",
            "过去一周内，我感到自己很容易被激怒",
            "过去一周内，我感到无法控制重要的事情",
            "过去一周内，我觉得事情堆积如山",
            "过去一周内，我感到紧张和焦虑",
            "过去一周内，我发现自己难以应对必须要做的事"
        ],
        "options": [
            {"value": 0, "label": "不符合"},
            {"value": 1, "label": "有点符合"},
            {"value": 2, "label": "相当符合"},
            {"value": 3, "label": "非常符合"}
        ],
        "scoring": {
            "depression": {"dimensions": [0, 1, 2, 3, 4, 5, 6]},
            "anxiety": {"dimensions": [7, 8, 9, 10, 11, 12, 13]},
            "stress": {"dimensions": [14, 15, 16, 17, 18, 19, 20]}
        }
    }
}


# ===== 请求/响应模型 =====

class QuestionnaireTypeResponse(BaseModel):
    """问卷类型响应"""
    id: str
    name: str
    description: str
    question_count: int


class StartQuestionnaireRequest(BaseModel):
    """开始问卷请求"""
    questionnaire_type: str
    mode: str = "conversational"  # conversational 或 form


class SubmitAnswerRequest(BaseModel):
    """提交答案请求"""
    session_id: uuid.UUID
    question_index: int
    answer_value: int
    answer_text: Optional[str] = None


class QuestionnaireSessionResponse(BaseModel):
    """问卷会话响应"""
    id: uuid.UUID
    questionnaire_type: str
    current_question_index: int
    total_questions: int
    is_completed: bool
    total_score: Optional[int]
    risk_level: str
    started_at: datetime
    completed_at: Optional[datetime]


class QuestionnaireResultResponse(BaseModel):
    """问卷结果响应"""
    session_id: uuid.UUID
    questionnaire_type: str
    total_score: int
    risk_level: str
    interpretation: str
    dimension_scores: Optional[Dict] = None
    recommendations: List[str]


class QuestionnaireHistoryItem(BaseModel):
    """问卷历史记录项"""
    id: uuid.UUID
    questionnaire_type: str
    total_score: Optional[int]
    risk_level: str
    is_completed: bool
    started_at: datetime
    completed_at: Optional[datetime]


# ===== API端点 =====

@router.get("/types", response_model=List[QuestionnaireTypeResponse])
async def get_questionnaire_types():
    """
    获取可用的问卷类型列表

    返回所有可用的专业心理评估问卷类型
    """
    types = []
    for type_id, definition in QUESTIONNAIRE_DEFINITIONS.items():
        types.append(QuestionnaireTypeResponse(
            id=type_id,
            name=definition["name"],
            description=definition["description"],
            question_count=len(definition["questions"])
        ))
    return types


@router.get("/types/{questionnaire_type}")
async def get_questionnaire_detail(
    questionnaire_type: str
):
    """
    获取问卷详情

    包括所有问题和选项
    """
    if questionnaire_type not in QUESTIONNAIRE_DEFINITIONS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"问卷类型 '{questionnaire_type}' 不存在"
        )

    definition = QUESTIONNAIRE_DEFINITIONS[questionnaire_type]
    return {
        "id": questionnaire_type,
        "name": definition["name"],
        "description": definition["description"],
        "questions": definition["questions"],
        "options": definition["options"],
        "question_count": len(definition["questions"])
    }


@router.post("/start", response_model=QuestionnaireSessionResponse)
async def start_questionnaire(
    request: StartQuestionnaireRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    开始新的问卷评估

    创建问卷会话并返回第一题
    """
    if request.questionnaire_type not in QUESTIONNAIRE_DEFINITIONS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"问卷类型 '{request.questionnaire_type}' 不存在"
        )

    definition = QUESTIONNAIRE_DEFINITIONS[request.questionnaire_type]

    # 创建问卷会话
    session = QuestionnaireSession(
        user_id=current_user.id,
        questionnaire_type=definition["type"],
        questions={
            "type": request.questionnaire_type,
            "mode": request.mode,
            "questions": definition["questions"],
            "options": definition["options"]
        },
        is_completed=False,
        current_question_index=0
    )

    db.add(session)
    await db.commit()
    await db.refresh(session)

    return QuestionnaireSessionResponse(
        id=session.id,
        questionnaire_type=request.questionnaire_type,
        current_question_index=0,
        total_questions=len(definition["questions"]),
        is_completed=False,
        total_score=None,
        risk_level="green",
        started_at=session.started_at,
        completed_at=None
    )


@router.post("/answer", response_model=QuestionnaireSessionResponse)
async def submit_answer(
    request: SubmitAnswerRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    提交答案

    保存用户答案并返回下一题或完成结果
    """
    # 获取问卷会话
    result = await db.execute(
        select(QuestionnaireSession)
        .where(QuestionnaireSession.id == request.session_id)
        .where(QuestionnaireSession.user_id == current_user.id)
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="问卷会话不存在"
        )

    if session.is_completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该问卷已完成"
        )

    # 获取问卷定义
    questionnaire_type = session.questions.get("type")
    definition = QUESTIONNAIRE_DEFINITIONS.get(questionnaire_type)
    if not definition:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="问卷定义丢失"
        )

    # 验证答案范围
    if request.answer_value < 0 or request.answer_value > 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="答案值必须在0-3范围内"
        )

    # 保存答案
    question_text = definition["questions"][request.question_index]
    answer = QuestionnaireAnswer(
        session_id=session.id,
        question_index=request.question_index,
        encrypted_question=encrypt_data(question_text),
        answer_value=request.answer_value,
        encrypted_answer_text=encrypt_data(request.answer_text) if request.answer_text else None
    )
    db.add(answer)

    # 更新当前问题索引
    next_index = request.question_index + 1
    total_questions = len(definition["questions"])

    if next_index >= total_questions:
        # 问卷完成
        session.is_completed = True
        session.completed_at = datetime.now(timezone.utc)
        session.current_question_index = total_questions - 1

        # 计算总分
        answers_result = await db.execute(
            select(QuestionnaireAnswer)
            .where(QuestionnaireAnswer.session_id == session.id)
        )
        answers = answers_result.scalars().all()
        total_score = sum(a.answer_value for a in answers)
        session.total_score = total_score

        # 确定风险等级
        session.risk_level = _calculate_risk_level(questionnaire_type, total_score)
    else:
        session.current_question_index = next_index

    await db.commit()
    await db.refresh(session)

    return QuestionnaireSessionResponse(
        id=session.id,
        questionnaire_type=questionnaire_type,
        current_question_index=session.current_question_index,
        total_questions=total_questions,
        is_completed=session.is_completed,
        total_score=session.total_score,
        risk_level=session.risk_level,
        started_at=session.started_at,
        completed_at=session.completed_at
    )


@router.get("/sessions/{session_id}/result", response_model=QuestionnaireResultResponse)
async def get_questionnaire_result(
    session_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    获取问卷评估结果

    返回分数、风险等级和解读
    """
    result = await db.execute(
        select(QuestionnaireSession)
        .where(QuestionnaireSession.id == session_id)
        .where(QuestionnaireSession.user_id == current_user.id)
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="问卷会话不存在"
        )

    if not session.is_completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="问卷尚未完成"
        )

    questionnaire_type = session.questions.get("type")
    definition = QUESTIONNAIRE_DEFINITIONS.get(questionnaire_type)

    # 解读结果
    interpretation = _generate_interpretation(questionnaire_type, session.total_score, definition)
    recommendations = _generate_recommendations(questionnaire_type, session.total_score, session.risk_level)

    # 解密已保存的解读（如果有）
    saved_interpretation = None
    if session.encrypted_interpretation:
        saved_interpretation = decrypt_data(session.encrypted_interpretation)

    return QuestionnaireResultResponse(
        session_id=session.id,
        questionnaire_type=questionnaire_type,
        total_score=session.total_score,
        risk_level=session.risk_level,
        interpretation=saved_interpretation or interpretation,
        dimension_scores=session.dimension_scores,
        recommendations=recommendations
    )


@router.get("/history", response_model=List[QuestionnaireHistoryItem])
async def get_questionnaire_history(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = 10
):
    """
    获取用户的问卷评估历史

    返回最近的评估记录
    """
    result = await db.execute(
        select(QuestionnaireSession)
        .where(QuestionnaireSession.user_id == current_user.id)
        .order_by(QuestionnaireSession.started_at.desc())
        .limit(limit)
    )
    sessions = result.scalars().all()

    history = []
    for session in sessions:
        questionnaire_type = session.questions.get("type", session.questionnaire_type.value)
        history.append(QuestionnaireHistoryItem(
            id=session.id,
            questionnaire_type=questionnaire_type,
            total_score=session.total_score,
            risk_level=session.risk_level,
            is_completed=session.is_completed,
            started_at=session.started_at,
            completed_at=session.completed_at
        ))

    return history


@router.get("/sessions/{session_id}")
async def get_session_detail(
    session_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    获取问卷会话详情

    包括当前问题和进度
    """
    result = await db.execute(
        select(QuestionnaireSession)
        .where(QuestionnaireSession.id == session_id)
        .where(QuestionnaireSession.user_id == current_user.id)
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="问卷会话不存在"
        )

    questionnaire_type = session.questions.get("type")
    definition = QUESTIONNAIRE_DEFINITIONS.get(questionnaire_type)

    # 获取当前问题
    current_question = None
    if not session.is_completed and definition:
        current_question = {
            "index": session.current_question_index,
            "text": definition["questions"][session.current_question_index],
            "options": definition["options"]
        }

    return {
        "id": session.id,
        "questionnaire_type": questionnaire_type,
        "is_completed": session.is_completed,
        "current_question": current_question,
        "progress": {
            "current": session.current_question_index + 1,
            "total": len(definition["questions"]) if definition else 0
        },
        "started_at": session.started_at
    }


# ===== 辅助函数 =====

def _calculate_risk_level(questionnaire_type: str, total_score: int) -> str:
    """根据总分计算风险等级"""
    if questionnaire_type == "phq9":
        if total_score >= 20:
            return "red"
        elif total_score >= 15:
            return "orange"
        elif total_score >= 10:
            return "yellow"
        else:
            return "green"
    elif questionnaire_type == "gad7":
        if total_score >= 15:
            return "red"
        elif total_score >= 10:
            return "orange"
        elif total_score >= 5:
            return "yellow"
        else:
            return "green"
    elif questionnaire_type == "dass21":
        if total_score >= 28:
            return "red"
        elif total_score >= 21:
            return "orange"
        elif total_score >= 14:
            return "yellow"
        else:
            return "green"
    return "green"


def _generate_interpretation(questionnaire_type: str, total_score: int, definition: dict) -> str:
    """生成评估结果解读"""
    if not definition:
        return "评估完成"

    scoring = definition.get("scoring", {})

    # 找到对应的分数等级
    for level_name, level_info in scoring.items():
        if total_score <= level_info.get("max", 100):
            return f"您的得分为 {total_score} 分，属于「{level_info['label']}」水平。{level_info['description']}。"

    return f"您的得分为 {total_score} 分。"


def _generate_recommendations(questionnaire_type: str, total_score: int, risk_level: str) -> List[str]:
    """生成个性化建议"""
    recommendations = []

    if risk_level == "red":
        recommendations.append("建议尽快寻求专业心理咨询帮助")
        recommendations.append("如有紧急情况，请拨打心理援助热线：400-161-9995")
    elif risk_level == "orange":
        recommendations.append("建议预约专业心理咨询进行进一步评估")
        recommendations.append("可以尝试放松练习和正念冥想")
    elif risk_level == "yellow":
        recommendations.append("建议关注自身情绪变化")
        recommendations.append("可以尝试运动、社交等方式调节情绪")
    else:
        recommendations.append("您的心理状态良好，继续保持健康的生活方式")
        recommendations.append("定期自我关注和情绪记录有助于维护心理健康")

    return recommendations
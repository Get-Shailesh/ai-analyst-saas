from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.ai_service import ai_service
from app.api.v1.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatRequest(BaseModel):
    dataset_id: str
    message: str
    history: list = []

@router.post("/message")
async def chat_message(
    req: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    answer = await ai_service.answer_question(
        dataset_id=req.dataset_id,
        question=req.message,
        history=req.history,
        db=db,
    )
    return {"success": True, "data": {"content": answer}}
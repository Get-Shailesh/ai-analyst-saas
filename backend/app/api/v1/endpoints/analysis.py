from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.analysis import AnalysisResult
from app.models.dataset import Dataset
from app.schemas.analysis import AnalysisRequest, AnalysisResponse, AnalysisStatusResponse
from app.services.analysis_service import analysis_service
from app.api.v1.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/analysis", tags=["analysis"])


@router.post("/run", response_model=dict)
async def run_analysis(
    req:         AnalysisRequest,
    db:          AsyncSession = Depends(get_db),
    current_user:User        = Depends(get_current_user),
):
    ds = await db.execute(select(Dataset).where(Dataset.id == req.dataset_id, Dataset.user_id == current_user.id))
    dataset = ds.scalar_one_or_none()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    result = await analysis_service.start(
        dataset, req.business_problem, req.analysis_types, req.depth, current_user.id, db
    )
    return { "success": True, "data": AnalysisStatusResponse.model_validate(result) }


@router.get("/{analysis_id}/status", response_model=dict)
async def get_status(
    analysis_id: str,
    db:          AsyncSession = Depends(get_db),
    current_user:User        = Depends(get_current_user),
):
    result = await db.execute(select(AnalysisResult).where(
        AnalysisResult.id == analysis_id,
        AnalysisResult.user_id == current_user.id
    ))
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return { "success": True, "data": AnalysisStatusResponse.model_validate(analysis) }


@router.get("/{analysis_id}", response_model=dict)
async def get_analysis(
    analysis_id: str,
    db:          AsyncSession = Depends(get_db),
    current_user:User        = Depends(get_current_user),
):
    result = await db.execute(select(AnalysisResult).where(
        AnalysisResult.id == analysis_id,
        AnalysisResult.user_id == current_user.id
    ))
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return { "success": True, "data": AnalysisResponse.model_validate(analysis) }

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.dataset import Dataset
from app.schemas.dataset import DatasetResponse, DatasetProfileResponse
from app.services.dataset_service import dataset_service
from app.api.v1.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/datasets", tags=["datasets"])


@router.post("/upload", response_model=dict)
async def upload_dataset(
    file:        UploadFile  = File(...),
    db:          AsyncSession = Depends(get_db),
    current_user:User        = Depends(get_current_user),
):
    try:
        dataset = await dataset_service.upload(file, current_user.id, db)
        return { "success": True, "message": "Uploaded", "data": DatasetResponse.model_validate(dataset) }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=dict)
async def list_datasets(
    db:          AsyncSession = Depends(get_db),
    current_user:User        = Depends(get_current_user),
):
    result = await db.execute(select(Dataset).where(Dataset.user_id == current_user.id).order_by(Dataset.created_at.desc()))
    datasets = result.scalars().all()
    return { "success": True, "data": [DatasetResponse.model_validate(d) for d in datasets] }


@router.get("/{dataset_id}", response_model=dict)
async def get_dataset(
    dataset_id:  str,
    db:          AsyncSession = Depends(get_db),
    current_user:User        = Depends(get_current_user),
):
    result = await db.execute(select(Dataset).where(Dataset.id == dataset_id, Dataset.user_id == current_user.id))
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return { "success": True, "data": DatasetResponse.model_validate(dataset) }


@router.get("/{dataset_id}/profile", response_model=dict)
async def get_profile(
    dataset_id:  str,
    db:          AsyncSession = Depends(get_db),
    current_user:User        = Depends(get_current_user),
):
    result = await db.execute(select(Dataset).where(Dataset.id == dataset_id, Dataset.user_id == current_user.id))
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    profile = await dataset_service.get_profile(dataset)
    return { "success": True, "data": profile }


@router.get("/{dataset_id}/preview", response_model=dict)
async def get_preview(
    dataset_id:  str,
    rows:        int = 50,
    db:          AsyncSession = Depends(get_db),
    current_user:User        = Depends(get_current_user),
):
    result = await db.execute(select(Dataset).where(Dataset.id == dataset_id, Dataset.user_id == current_user.id))
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    preview = await dataset_service.get_preview(dataset, rows)
    return { "success": True, "data": preview }


@router.delete("/{dataset_id}", response_model=dict)
async def delete_dataset(
    dataset_id:  str,
    db:          AsyncSession = Depends(get_db),
    current_user:User        = Depends(get_current_user),
):
    result = await db.execute(select(Dataset).where(Dataset.id == dataset_id, Dataset.user_id == current_user.id))
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    await db.delete(dataset)
    return { "success": True, "message": "Deleted" }

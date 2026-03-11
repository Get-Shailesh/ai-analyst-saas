from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pathlib import Path
from pydantic import BaseModel
from app.core.database import get_db
from app.models.report import Report
from app.services.report_service import report_service
from app.api.v1.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/reports", tags=["reports"])

class ReportRequest(BaseModel):
    analysis_id: str
    format: str  # pdf | pptx | excel | json

@router.post("/generate", response_model=dict)
async def generate_report(
    req: ReportRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = await report_service.generate(req.analysis_id, req.format, db)
    return {"success": True, "data": {"id": report.id, "status": report.status, "format": report.format}}

@router.get("/{report_id}/status", response_model=dict)
async def report_status(
    report_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"success": True, "data": {"id": report.id, "status": report.status, "download_url": report.download_url}}

@router.get("/{report_id}/download")
async def download_report(
    report_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if not report or not report.file_path:
        raise HTTPException(status_code=404, detail="Report not ready")
    path = Path(report.file_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path=str(path), filename=path.name)

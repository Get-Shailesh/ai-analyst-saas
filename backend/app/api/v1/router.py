from fastapi import APIRouter
from app.api.v1.endpoints import auth, datasets, analysis, chat, reports

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(datasets.router)
api_router.include_router(analysis.router)
api_router.include_router(chat.router)
api_router.include_router(reports.router)

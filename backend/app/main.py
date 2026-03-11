from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1.router import api_router
from loguru import logger
import time
from fastapi import Request, Response


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created")
    yield
    # Shutdown
    await engine.dispose()
    logger.info("Database connections closed")


app = FastAPI(
    title       = settings.APP_NAME,
    description = "AI-powered business data analysis API",
    version     = "1.0.0",
    docs_url    = "/docs",
    redoc_url   = "/redoc",
    lifespan    = lifespan,
)

# ── Middleware ────────────────────────────────────────────────────────────────
cors_origins = settings.CORS_ORIGINS.split(",") if isinstance(settings.CORS_ORIGINS, str) else settings.CORS_ORIGINS
cors_origins = [o.strip().rstrip("/") for o in cors_origins]
cors_origins.append("*")

app.add_middleware(
    CORSMiddleware,
    allow_origins     = cors_origins,
    allow_credentials = False,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

@app.middleware("http")
async def add_process_time(request: Request, call_next):
    start = time.time()
    response: Response = await call_next(request)
    response.headers["X-Process-Time"] = str(round(time.time() - start, 4))
    return response

# ── Routes ────────────────────────────────────────────────────────────────────
app.include_router(api_router)

@app.get("/health")
async def health():
    return { "status": "ok", "service": settings.APP_NAME, "version": "1.0.0" }

@app.get("/")
async def root():
    return { "message": f"Welcome to {settings.APP_NAME} API", "docs": "/docs" }

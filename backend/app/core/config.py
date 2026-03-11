from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # App
    APP_NAME:    str = "AI Business Data Analyst"
    APP_ENV:     str = "development"
    APP_PORT:    int = 8000
    DEBUG:       bool = True
    FRONTEND_URL: str = "http://localhost:3000"

    # Database
    DATABASE_URL:      str = "postgresql+asyncpg://postgres:password@localhost:5432/ai_analyst_db"
    DATABASE_TEST_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/ai_analyst_test"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # AI
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY:    str = ""
    LLM_MODEL:         str = "claude-sonnet-4-6"
    LLM_MAX_TOKENS:    int = 4096

    # Auth
    JWT_SECRET_KEY:    str = "change-me-in-production"
    JWT_ALGORITHM:     str = "HS256"
    JWT_EXPIRE_MINUTES:int = 1440

    # Storage
    STORAGE_TYPE:      str  = "local"
    LOCAL_UPLOAD_DIR:  str  = "./uploads"
    AWS_S3_BUCKET:     str  = ""
    AWS_REGION:        str  = "us-east-1"
    AWS_ACCESS_KEY_ID: str  = ""
    AWS_SECRET_ACCESS_KEY: str = ""

    # Celery
    CELERY_BROKER_URL:    str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND:str = "redis://localhost:6379/2"

    # Security
    CORS_ORIGINS:         str = "http://localhost:3000,http://localhost:3001"
    MAX_UPLOAD_SIZE_MB:   int = 100
    RATE_LIMIT_PER_MINUTE:int = 60

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

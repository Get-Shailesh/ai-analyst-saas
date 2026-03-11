import asyncio
from app.core.database import engine, Base
from app.models import User, Dataset, AnalysisResult, Report

async def create():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Tables created successfully!")

asyncio.run(create())
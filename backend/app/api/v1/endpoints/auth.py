from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.api.v1.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=dict)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == req.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(email=req.email, name=req.name, hashed_pw=hash_password(req.password))
    db.add(user)
    await db.flush()

    token = create_access_token({ "sub": user.id, "email": user.email })
    return { "success": True, "data": TokenResponse(access_token=token, user_id=user.id, name=user.name, email=user.email, plan=user.plan.value) }


@router.post("/login", response_model=dict)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(req.password, user.hashed_pw):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")

    token = create_access_token({ "sub": user.id, "email": user.email })
    return { "success": True, "data": TokenResponse(access_token=token, user_id=user.id, name=user.name, email=user.email, plan=user.plan.value) }


@router.get("/me", response_model=dict)
async def me(current_user: User = Depends(get_current_user)):
    return { "success": True, "data": { "id": current_user.id, "email": current_user.email, "name": current_user.name, "plan": current_user.plan.value } }

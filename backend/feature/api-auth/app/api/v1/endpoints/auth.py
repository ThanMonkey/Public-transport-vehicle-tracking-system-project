# Endpoint: POST /api/v1/auth/token สำหรับ Login
# app/api/v1/endpoints/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.core.security import verify_password, create_access_token
from app.schemas.auth import Token
from app.dependencies.auth_deps import FAKE_USERS_DB

router = APIRouter()

@router.post("/token", response_model=Token, tags=["Authentication"])
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """รับ Username/Password และส่ง Access Token กลับไป"""
    user_data = FAKE_USERS_DB.get(form_data.username)

    if not user_data or not verify_password(form_data.password, user_data["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # สร้าง JWT Token
    access_token = create_access_token(
        data={"sub": user_data["id"], "role": user_data["role"]}
    )
    
    return Token(access_token=access_token)
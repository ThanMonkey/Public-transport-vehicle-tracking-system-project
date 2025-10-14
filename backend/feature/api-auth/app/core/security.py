# จัดการการเข้ารหัสรหัสผ่าน (Hashing) และฟังก์ชันสร้าง/ตรวจสอบ JWT
# app/core/security.py
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
import jwt
from passlib.context import CryptContext
from .config import settings

# 1. Password Hashing (ใช้ bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """ตรวจสอบว่ารหัสผ่านที่ส่งมาตรงกับ hash ใน DB หรือไม่"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """สร้าง hash จากรหัสผ่าน"""
    return pwd_context.hash(password)

# 2. JWT Functions
def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """สร้าง JWT Access Token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # sub: Subject (user ID), role: User role, exp: Expiration Time, iat: Issued At
    to_encode.update({"exp": expire.timestamp(), "iat": datetime.now(timezone.utc).timestamp()})
    
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """ตรวจสอบและถอดรหัส JWT"""
    try:
        # algorithms ต้องระบุตามที่ใช้ในการ encode
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        # Token หมดอายุ
        return None 
    except jwt.InvalidTokenError:
        # Token ไม่ถูกต้องหรือไม่สมบูรณ์
        return None
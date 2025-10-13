# Dependency หลัก: get_current_user() สำหรับตรวจสอบโทเค็น
# app/dependencies/auth_deps.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.core.security import decode_access_token

# กำหนด URL ที่ใช้ในการรับ Token (ใช้ใน OpenAPI/Swagger UI)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

# *** ข้อมูลผู้ใช้จำลอง (แทนการดึงจาก DB) ***
# Hash ของรหัสผ่าน "password123"
ADMIN_PASS_HASH = "$2b$12$fH8nLg/bJm/D7.T0A0X.W.h4f.vI0W.eR0tZ9V0Q8vH0"
USER_PASS_HASH = "$2b$12$fH8nLg/bJm/D7.T0A0X.W.h4f.vI0W.eR0tZ9V0Q8vH0"

FAKE_USERS_DB = {
    "admin": {"id": 1, "username": "admin", "password_hash": ADMIN_PASS_HASH, "role": "admin"},
    "driver1": {"id": 2, "username": "driver1", "password_hash": USER_PASS_HASH, "role": "driver"},
    "user1": {"id": 3, "username": "user1", "password_hash": USER_PASS_HASH, "role": "user"},
}

def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    """ดึงข้อมูลผู้ใช้จาก ID (จำลอง)"""
    for user in FAKE_USERS_DB.values():
        if user["id"] == user_id:
            # คัดลอกข้อมูลที่ไม่ใช่ hash ออกไป
            return {"id": user["id"], "username": user["username"], "role": user["role"]}
    return None

def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """ตรวจสอบ JWT และดึงข้อมูลผู้ใช้ที่ใช้งานอยู่"""
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id: int = payload.get("sub")
    
    # ตรวจสอบกับ DB จำลอง
    user = get_user_by_id(user_id)
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
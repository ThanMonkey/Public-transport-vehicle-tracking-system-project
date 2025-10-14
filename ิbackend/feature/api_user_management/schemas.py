from pydantic import BaseModel
from typing import Optional
from .models import Role

class UserCreate(BaseModel):
    username: str
    password: str
    role: Optional[Role] = Role.user

class UserUpdate(BaseModel):
    password: Optional[str] = None
    role: Optional[Role] = None
    is_active: Optional[bool] = None

class UserOut(BaseModel):
    id: str
    username: str
    role: Role
    is_active: bool

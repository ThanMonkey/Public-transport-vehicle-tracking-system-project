from enum import Enum
from typing import List, Optional
from pydantic import BaseModel
import uuid

class Role(str, Enum):
    user = "user"
    driver = "driver"
    admin = "admin"

class User(BaseModel):
    id: str
    username: str
    hashed_password: str
    role: Role
    is_active: bool = True

# จำลองฐานข้อมูล (in-memory)
FAKE_DB: List[User] = []

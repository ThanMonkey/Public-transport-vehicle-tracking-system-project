from pydantic import BaseModel, Field
from datetime import datetime

class Notification(BaseModel):
    user_id: str
    message: str
    read: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)

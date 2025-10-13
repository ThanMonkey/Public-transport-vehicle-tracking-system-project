from pydantic import BaseModel, Field
from datetime import datetime

class Notification(BaseModel):
    user_id: str = Field(..., example="user-001")
    title: str = Field(..., example="Bus Arrival")
    message: str = Field(..., example="Bus 12 will arrive in 5 minutes")
    timestamp: datetime = Field(..., example="2025-10-12T10:00:00")

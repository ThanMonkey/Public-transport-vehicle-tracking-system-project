from pydantic import BaseModel, Field
from datetime import datetime

class GPSData(BaseModel):
    device_id: str = Field(..., example="bus-001")
    latitude: float = Field(..., example=13.7563)
    longitude: float = Field(..., example=100.5018)
    timestamp: datetime = Field(..., example="2025-10-12T10:00:00")

from pydantic import BaseModel, Field
from datetime import datetime

class GPSData(BaseModel):
    user_id: str
    lat: float
    lng: float
    timestamp: str
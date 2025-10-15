from fastapi import APIRouter
from pydantic import BaseModel
from backend.firebase.firebase_config import get_firestore
from datetime import datetime

router = APIRouter()

# เก็บข้อมูล GPS ชั่วคราวใน memory
db = get_firestore()

class GPSData(BaseModel):
    bus_id: str
    latitude: float
    longitude: float
    timestamp: str = None  # ถ้าไม่ส่งจะใส่ datetime.now()

@router.post("/gps")
async def receive_gps(data: GPSData):
    doc_ref = db.collection("bus_tracking").document(data.bus_id)
    
    # ใช้ timestamp ปัจจุบันถ้าไม่ส่ง
    timestamp = data.timestamp or datetime.utcnow().isoformat()
    
    doc_ref.set({
        "bus_id": data.bus_id,
        "latitude": data.latitude,
        "longitude": data.longitude,
        "timestamp": timestamp
    })
    
    return {"message": f"Data for {data.bus_id} saved successfully!"}

@router.get("/gps/{bus_id}")
async def get_gps(bus_id: str):
    doc = db.collection("bus_tracking").document(bus_id).get()
    if doc.exists:
        return doc.to_dict()
    return {"error": "Bus not found"}

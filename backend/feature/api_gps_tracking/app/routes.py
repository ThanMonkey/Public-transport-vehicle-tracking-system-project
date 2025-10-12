from fastapi import APIRouter
from .models import GPSData

router = APIRouter()

# เก็บข้อมูล GPS ชั่วคราวใน memory
gps_store = []

@router.post("/gps")
async def receive_gps(data: GPSData):
    gps_store.append(data)
    return {"message": "GPS data received", "total_records": len(gps_store)}

@router.get("/gps")
async def get_all_gps():
    return gps_store

@router.get("/health")
async def health_check():
    return {"status": "ok"}

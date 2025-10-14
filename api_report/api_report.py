# กำหนด API Endpoint สำหรับการ Export รายงาน
# api_report.py

import pandas as pd
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from io import StringIO
from mock_data import get_mock_bus_data

# สร้าง Router สำหรับจัดกลุ่ม Endpoints
router = APIRouter(
    prefix="/reports",
    tags=["reports"],
)

@router.get("/bus-locations-csv")
async def export_bus_locations_csv():
    """
    Endpoint สำหรับดึงข้อมูลตำแหน่งรถเมล์ทั้งหมด
    และ Export เป็นไฟล์ CSV
    """
    # 1. ดึงข้อมูล (แทนการดึงจาก Database)
    bus_data = get_mock_bus_data()
    
    # 2. แปลงข้อมูลเป็น Pandas DataFrame
    df = pd.DataFrame(bus_data)
    
    # 3. จัดการข้อมูล/จัดรูปแบบ (ถ้าจำเป็น)
    # ตัวอย่าง: จัดเรียงคอลัมน์
    column_order = ["bus_id", "route", "status", "speed_kmh", "latitude", "longitude", "last_update"]
    df = df[column_order]
    
    # 4. แปลง DataFrame เป็น CSV String
    # index=False คือไม่ใส่หมายเลข Index ลงในไฟล์ CSV
    csv_string = StringIO()
    df.to_csv(csv_string, index=False, encoding='utf-8-sig') # ใช้ utf-8-sig เพื่อรองรับภาษาไทยใน Excel
    csv_string.seek(0)
    
    # 5. สร้าง StreamingResponse สำหรับส่งไฟล์ CSV กลับไป
    return StreamingResponse(
        iter([csv_string.read()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=bus_locations_report.csv"
        }
    )

@router.get("/bus-status-json")
async def get_bus_status_json():
    """
    Endpoint ตัวอย่างสำหรับดึงข้อมูลเป็น JSON 
    (กรณีไม่ต้องการ export ไฟล์)
    """
    bus_data = get_mock_bus_data()
    return {"data": bus_data, "count": len(bus_data)}
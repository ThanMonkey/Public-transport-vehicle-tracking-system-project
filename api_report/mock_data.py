# ข้อมูลจำลองสำหรับใช้ในการทำรายงาน (แทน Database)
# mock_data.py

from datetime import datetime
import random

# ข้อมูลรถเมล์จำลอง
def get_mock_bus_data():
    """สร้างข้อมูลจำลองการติดตามรถเมล์"""
    bus_routes = ["สาย A", "สาย B", "สาย C", "สาย D"]
    statuses = ["กำลังวิ่ง", "จอด", "นอกเส้นทาง", "ล่าช้า"]
    data = []
    
    for i in range(1, 11): # จำลองรถเมล์ 10 คัน
        bus_id = f"BUS-{i:03d}"
        route = random.choice(bus_routes)
        
        # ตำแหน่งจำลองใกล้เคียงศูนย์กลาง
        latitude = 13.7563 + (random.random() - 0.5) * 0.01 
        longitude = 100.5018 + (random.random() - 0.5) * 0.01 
        
        speed = round(random.uniform(0, 60), 2) # ความเร็ว (กม./ชม.)
        status = random.choice(statuses)
        last_update = datetime.now().isoformat()
        
        data.append({
            "bus_id": bus_id,
            "route": route,
            "latitude": latitude,
            "longitude": longitude,
            "speed_kmh": speed,
            "status": status,
            "last_update": last_update,
        })
    return data
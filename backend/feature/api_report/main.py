# ไฟล์หลักสำหรับรัน FastAPI App
# main.py

from fastapi import FastAPI
from api_report import router as report_router

app = FastAPI(
    title="Bus Tracking Report API",
    description="API สำหรับระบบติดตามรถเมล์และ Export รายงาน",
    version="1.0.0",
)

# เชื่อมต่อ Router ของรายงาน
app.include_router(report_router)

@app.get("/", tags=["Root"])
def read_root():
    return {"message": "Welcome to the Bus Tracking Report API. Go to /docs for API documentation."}

# หมายเหตุ: โดยปกติจะรันด้วย uvicorn ผ่าน Command Line (ดูวิธีการรันด้านล่าง)
# แต่ถ้าต้องการรันจากไฟล์นี้โดยตรง (สำหรับการทดสอบหรือ dev environment)
# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)
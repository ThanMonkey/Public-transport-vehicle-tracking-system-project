from fastapi import APIRouter, HTTPException
from .models import Notification
from backend.firebase.firebase_config import get_firestore
from datetime import datetime

router = APIRouter()

# เก็บ notification ชั่วคราวใน memory
db = get_firestore()
collection_name = "notifications"
notif_collection = db.collection(collection_name)

@router.post("/notify/{notif_id}")
async def send_notification(notif_id: str, notification: Notification):
    notif_data = notification.dict()
    # สร้าง timestamp ถ้าไม่มี
    notif_data["created_at"] = notif_data.get("created_at") or datetime.utcnow().isoformat()
    
    # บันทึกลง Firestore ด้วย ID ที่กำหนด
    notif_collection.document(notif_id).set(notif_data)
    return {"message": f"Notification '{notif_id}' sent to Firestore"}

# ดึง notification ทั้งหมด หรือ filter by user_id / unread
@router.get("/notify")
async def get_notifications(user_id: str = None, unread_only: bool = False):
    query = notif_collection
    if user_id:
        query = query.where("user_id", "==", user_id)
    if unread_only:
        query = query.where("read", "==", False)
    
    docs = query.stream()
    result = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        result.append(data)
    return result

# ดึง notification เฉพาะอันตาม notif_id
@router.get("/notify/{notif_id}")
async def get_notification_by_id(notif_id: str):
    doc = notif_collection.document(notif_id).get()
    if doc.exists:
        data = doc.to_dict()
        data["id"] = doc.id
        return data
    else:
        raise HTTPException(status_code=404, detail=f"Notification '{notif_id}' not found")
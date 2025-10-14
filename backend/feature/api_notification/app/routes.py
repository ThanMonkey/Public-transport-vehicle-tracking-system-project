from fastapi import APIRouter
from .models import Notification

router = APIRouter()

# เก็บ notification ชั่วคราวใน memory
notification_store = []

@router.post("/notify")
async def send_notification(notification: Notification):
    notification_store.append(notification)
    return {"message": "Notification sent", "total_notifications": len(notification_store)}

@router.get("/notify")
async def get_notifications():
    return notification_store

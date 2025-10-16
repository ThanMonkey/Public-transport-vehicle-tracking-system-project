from fastapi import WebSocket
from typing import List
from backend.firebase.firebase_config import get_firestore
import asyncio

db = get_firestore()


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        self.active_connections.append(websocket)
        print(f"✅ Client connected ({len(self.active_connections)})")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        print(f"❌ Client disconnected ({len(self.active_connections)})")

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)

    async def broadcast_realtime(self):
        """
        ดึงตำแหน่งล่าสุดจาก Firestore แล้วส่งให้ทุก client ทุก 5 วินาที
        """
        while True:
            buses_ref = db.collection("bus_tracking")
            docs = buses_ref.stream()
            result = []
            for doc in docs:
                data = doc.to_dict()
                result.append({
                    "bus_id": data.get("bus_id"),
                    "latitude": data.get("latitude"),
                    "longitude": data.get("longitude"),
                    "timestamp": data.get("timestamp")
                })
            if self.active_connections:
                await self.broadcast({"buses": result})
            await asyncio.sleep(5)  # ปรับเวลาได้ตามต้องการ

manager = ConnectionManager()

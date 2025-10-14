from fastapi import WebSocket
from typing import List

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"✅ Client connected ({len(self.active_connections)})")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        print(f"❌ Client disconnected ({len(self.active_connections)})")

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)

manager = ConnectionManager()

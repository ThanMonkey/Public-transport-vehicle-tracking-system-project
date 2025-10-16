from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from .websocket import manager
import asyncio
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Realtime GPS Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # หรือใส่ domain ของ client
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    # เริ่ม broadcast Realtime
    asyncio.create_task(manager.broadcast_realtime())

@app.websocket("/realtime")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    await manager.connect(websocket)
    try:
        while True:
            # ส่ง heartbeat หรือข้อมูล realtime
            await asyncio.sleep(1)
            await manager.broadcast({"msg": "heartbeat"})
    except WebSocketDisconnect:
        manager.disconnect(websocket)

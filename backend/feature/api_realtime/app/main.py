from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from .websocket import manager

app = FastAPI(title="Realtime GPS Service")

@app.websocket("/realtime")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            await manager.broadcast(data)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

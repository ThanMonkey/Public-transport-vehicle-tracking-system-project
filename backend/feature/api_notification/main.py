from fastapi import FastAPI
from .routes import router as notification_router

app = FastAPI(title="Notification Service")

app.include_router(notification_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8001, reload=True)

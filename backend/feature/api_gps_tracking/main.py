from fastapi import FastAPI
from .routes import router as gps_router

app = FastAPI(title="GPS Tracking Service")

app.include_router(gps_router)

@app.get("/")
async def root():
    return {"message": "Backend is running!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

from fastapi import FastAPI
from .routers import users

app = FastAPI(title="Bus Tracking - User Management (No DB)")
app.include_router(users.router)

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, EmailStr
from .auth_service import register_user, login_user

app = FastAPI()

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    role: str = "user"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@app.post("/register")
def register(req: RegisterRequest):
    data, error = register_user(req.email, req.password, req.role)
    if error:
        raise HTTPException(status_code=400, detail=error)
    return data

@app.post("/login")
def login(req: LoginRequest):
    data, error = login_user(req.email, req.password)
    if error:
        raise HTTPException(status_code=400, detail=error)
    return data

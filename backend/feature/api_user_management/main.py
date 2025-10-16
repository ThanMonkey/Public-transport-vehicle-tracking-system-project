from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from .user_service import list_users, get_user, update_user, delete_user

app = FastAPI(title="User Management API")

class UpdateUserRequest(BaseModel):
    role: str = None
    password: str = None

@app.get("/users")
def api_list_users():
    return list_users()

@app.get("/users/{user_id}")
def api_get_user(user_id: str):
    data, error = get_user(user_id)
    if error:
        raise HTTPException(status_code=404, detail=error)
    return data

@app.put("/users/{user_id}")
def api_update_user(user_id: str, req: UpdateUserRequest):
    data, error = update_user(user_id, role=req.role, password=req.password)
    if error:
        raise HTTPException(status_code=404, detail=error)
    return data

@app.delete("/users/{user_id}")
def api_delete_user(user_id: str):
    data, error = delete_user(user_id)
    if error:
        raise HTTPException(status_code=404, detail=error)
    return data

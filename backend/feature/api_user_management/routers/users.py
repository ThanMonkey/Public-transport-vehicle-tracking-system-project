from fastapi import APIRouter, HTTPException, Depends
from .. import schemas, models, auth
import uuid

router = APIRouter(prefix="/users", tags=["Users"])

# 🟢 Register
@router.post("/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate):
    if any(u.username == user.username for u in models.FAKE_DB):
        raise HTTPException(status_code=400, detail="Username already exists")

    new_user = models.User(
        id=str(uuid.uuid4()),
        username=user.username,
        hashed_password=auth.hash_password(user.password),
        role=user.role
    )
    models.FAKE_DB.append(new_user)
    return new_user

# 🟢 Login
@router.post("/login")
def login(user: schemas.UserCreate):
    db_user = next((u for u in models.FAKE_DB if u.username == user.username), None)
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = auth.create_access_token({"sub": db_user.username, "role": db_user.role})
    return {"access_token": token, "token_type": "bearer"}

# 🟡 Current user info
@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

# 🔵 Get all users (Admin only)
@router.get("/", response_model=list[schemas.UserOut])
def get_all(current_user: models.User = Depends(auth.require_role(["admin"]))):
    return models.FAKE_DB

# 🟠 Update user (Admin only)
@router.put("/{user_id}", response_model=schemas.UserOut)
def update_user(
    user_id: str,
    update: schemas.UserUpdate,
    current_user: models.User = Depends(auth.require_role(["admin"]))
):
    user = next((u for u in models.FAKE_DB if u.id == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if update.password:
        user.hashed_password = auth.hash_password(update.password)
    if update.role:
        user.role = update.role
    if update.is_active is not None:
        user.is_active = update.is_active

    return user

# 🔴 Delete user (Admin only)
@router.delete("/{user_id}")
def delete_user(
    user_id: str,
    current_user: models.User = Depends(auth.require_role(["admin"]))
):
    user = next((u for u in models.FAKE_DB if u.id == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    models.FAKE_DB.remove(user)
    return {"message": f"User '{user.username}' deleted."}

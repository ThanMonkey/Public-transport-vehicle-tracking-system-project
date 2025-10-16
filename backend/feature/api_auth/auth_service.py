from backend.firebase.firebase_config import get_firestore
from .utils import hash_password, verify_password
from datetime import datetime, timezone

db = get_firestore()
COLLECTION_NAME = "auth_users"

# ---------------- Register ----------------
def register_user(email: str, password: str, role: str = "user"):
    try:
        # ตรวจสอบ email ซ้ำ
        existing = db.collection(COLLECTION_NAME).where("email", "==", email).get()
        if existing:
            return None, "Email already registered"

        # Hash password
        hashed_pw = hash_password(password)

        # สร้างรหัส document แบบ role + 3 หลัก
        # นับจำนวน user เดิมใน role เพื่อเพิ่มเลข
        role_docs = db.collection(COLLECTION_NAME).where("role", "==", role).get()
        next_num = len(role_docs) + 1
        doc_id = f"{role}{next_num:03d}"  # admin001, user001, driver001

        # ข้อมูล user
        data = {
            "email": email,
            "password": hashed_pw,
            "role": role,
            "created_at": datetime.now(timezone.utc)
        }

        # สร้าง document ด้วยชื่อ doc_id
        db.collection(COLLECTION_NAME).document(doc_id).set(data)

        return {"id": doc_id, "email": email, "role": role}, None
    except Exception as e:
        return None, str(e)
        
# ---------------- Login ----------------
def login_user(email: str, password: str):
    try:
        query = db.collection(COLLECTION_NAME).where("email", "==", email).get()
        if not query:
            return None, "User not found"

        user_doc = query[0]
        user_data = user_doc.to_dict()

        if not verify_password(password, user_data["password"]):
            return None, "Incorrect password"

        return {"email": user_data["email"], "role": user_data["role"]}, None
    except Exception as e:
        return None, str(e)

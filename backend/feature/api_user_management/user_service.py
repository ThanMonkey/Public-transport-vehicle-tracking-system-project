from backend.firebase.firebase_config import get_firestore

db = get_firestore()
collection = db.collection("auth_users")  # ใช้ collection เดิมจาก auth

def list_users():
    users = []
    for doc in collection.stream():
        data = doc.to_dict()
        users.append({"id": doc.id, "email": data["email"], "role": data["role"]})
    return users

def get_user(user_id: str):
    doc = collection.document(user_id).get()
    if not doc.exists:
        return None, "User not found"
    data = doc.to_dict()
    return {"id": doc.id, "email": data["email"], "role": data["role"]}, None

def update_user(user_id: str, role: str = None, password: str = None):
    doc_ref = collection.document(user_id)
    doc = doc_ref.get()
    if not doc.exists:
        return None, "User not found"
    update_data = {}
    if role:
        update_data["role"] = role
    if password:
        from .utils import hash_password
        update_data["password"] = hash_password(password)
    doc_ref.update(update_data)
    return {"id": user_id, **update_data}, None

def delete_user(user_id: str):
    doc = collection.document(user_id).get()
    if not doc.exists:
        return None, "User not found"
    collection.document(user_id).delete()
    return {"id": user_id}, None

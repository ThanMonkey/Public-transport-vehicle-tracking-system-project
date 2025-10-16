from backend.firebase.firebase_config import get_firestore
from datetime import datetime

# เชื่อม Firestore
db = get_firestore()

def test_firestore():
    try:
        # สร้าง document ใหม่ใน collection "test_users"
        doc_ref = db.collection("test_users").document()
        test_data = {
            "email": "test@example.com",
            "created_at": datetime.utcnow(),
            "role": "user"
        }
        doc_ref.set(test_data)
        print("✅ Write to Firestore success!")

        # อ่าน document ที่เพิ่งสร้าง
        doc = doc_ref.get()
        if doc.exists:
            print("✅ Read from Firestore success:", doc.to_dict())
        else:
            print("❌ Document not found")
    except Exception as e:
        print("❌ Firestore connection failed:", e)

if __name__ == "__main__":
    test_firestore()

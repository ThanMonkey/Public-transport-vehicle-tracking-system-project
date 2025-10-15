import os
import firebase_admin
from firebase_admin import credentials, firestore

# โหลด key ของโปรเจกต์ Firebase
cred_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
cred = credentials.Certificate(cred_path)

# เริ่มต้นเชื่อมต่อ Firebase
firebase_admin.initialize_app(cred)

# สร้างตัวเชื่อมกับ Firestore database
db = firestore.client()

# ฟังก์ชันสำหรับ import ไปใช้ใน route อื่นๆ
def get_firestore():
    return db

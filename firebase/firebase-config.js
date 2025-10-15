// firebase-config.js

// นำเข้าโมดูลจาก Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

// ตั้งค่า config ของโปรเจกต์
const firebaseConfig = {
  apiKey: "AIzaSyAElugi9nkthLlrEsZX-OEMSAR6JW_o9z8",
  authDomain: "transport-tracking-8eb8c.firebaseapp.com",
  projectId: "transport-tracking-8eb8c",
  storageBucket: "transport-tracking-8eb8c.firebasestorage.app",
  messagingSenderId: "533753141107",
  appId: "1:533753141107:web:24780698acdd446e415706",
  measurementId: "G-CFBZ2BFVBZ"
};

// เริ่มต้นใช้งาน Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// เชื่อมโมดูลที่ต้องใช้
const db = getFirestore(app);     // สำหรับ Firestore
const auth = getAuth(app);        // สำหรับระบบล็อกอิน
const storage = getStorage(app);  // สำหรับอัปโหลดไฟล์ (optional)

// ส่งออก (ให้ไฟล์อื่น import ได้)
export { db, auth, storage };

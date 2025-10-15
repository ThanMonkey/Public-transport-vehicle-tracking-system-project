from flask import Flask, render_template, redirect, url_for, request, jsonify
from admin import admin_bp
import random
from backend.firebase.firebase_config import get_firestore

app = Flask(__name__)

# -------------------------------
# Mock Data (for map)
# -------------------------------
buses = [
    {"id": 1, "line": "A", "lat": 13.729, "lng": 100.776},
    {"id": 2, "line": "B", "lat": 13.731, "lng": 100.774},
]

bus_stops = [
    {"name": "หอประชุมเจ้าพระยาสุรวงษ์ไวยวัฒน์", "lat": 13.7295, "lng": 100.7750},
    {"name": "Airport Rail Link ลาดกระบัง", "lat": 13.7310, "lng": 100.7755},
    {"name": "วิทยาลัยเทคโนโลยีและนวัตกรรมวัสดุ", "lat": 13.7300, "lng": 100.7770},
    {"name": "ตึก ECC & อาคาร 55 พรรษา", "lat": 13.7320, "lng": 100.7780},
    {"name": "คณะแพทยศาสตร์", "lat": 13.7330, "lng": 100.7790},
]

# -------------------------------
# Routes for Web Pages
# -------------------------------
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/register')
def register():
    return render_template('register.html')

# -------------------------------
# API Routes (for Map)
# -------------------------------
@app.route('/api/stops')
def get_stops():
    return jsonify(bus_stops)

@app.route('/api/buses')
def get_buses():
    # Mock movement
    for bus in buses:
        bus["lat"] += random.uniform(-0.0003, 0.0003)
        bus["lng"] += random.uniform(-0.0003, 0.0003)
    return jsonify(buses)

# -------------------------------
# Firebase Test Route
# -------------------------------
@app.route('/test-firebase')
def test_firebase():
    try:
        db = get_firestore()
        doc_ref = db.collection("test_connection").document("status")
        doc_ref.set({"connected": True})
        return {"message": "✅ Firestore connected successfully!"}
    except Exception as e:
        return {"error": str(e)}

# -------------------------------
# Admin Blueprint
# -------------------------------
app.register_blueprint(admin_bp, url_prefix="/admin")

# -------------------------------

# -------------------------------
# Admin Blueprint
# -------------------------------
app.register_blueprint(admin_bp, url_prefix="/admin")

# -------------------------------

# Run Flask
# -------------------------------
if __name__ == '__main__':
    app.run(debug=True)

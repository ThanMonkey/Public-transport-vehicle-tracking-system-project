from flask import Flask, render_template, redirect, url_for, request, jsonify

app = Flask(__name__)

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
# Mock APIs (จำลองข้อมูลเพื่อให้หน้าแผนที่ทำงาน)
# -------------------------------
@app.route('/api/stops')
def api_stops():
    stops = [
        {"name": "หอประชุมเจ้าพระยาสุรวงษ์ไวยวัฒน์", "lat": 13.7295, "lng": 100.7758},
        {"name": "Airport Rail Link ลาดกระบัง", "lat": 13.7302, "lng": 100.7762},
        {"name": "วิทยาลัยเทคโนโลยีและนวัตกรรมวัสดุ", "lat": 13.7287, "lng": 100.7771},
        {"name": "ตึก ECC & อาคาร 55 พรรษา", "lat": 13.7320, "lng": 100.7780},
        {"name": "คณะแพทยศาสตร์", "lat": 13.7330, "lng": 100.7790},
    ]
    return jsonify(stops)

@app.route('/api/buses')
def api_buses():
    buses = [
        {"id": 1, "line": "A", "lat": 13.7298, "lng": 100.7765},
        {"id": 2, "line": "B", "lat": 13.7289, "lng": 100.7755}
    ]
    return jsonify(buses)

if __name__ == '__main__':
    app.run(debug=True)

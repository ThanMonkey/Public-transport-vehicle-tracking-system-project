from flask import Flask, render_template, jsonify
import requests
import os

app = Flask(__name__)

# 🔑 ใส่ Google Maps API Key ของคุณตรงนี้
GOOGLE_MAPS_API_KEY = "YOUR_API_KEY"

# Mock ต้นทาง-ปลายทาง (เช่น จุดใน KMITL)
routes = {
    "Line-1": {
        "bus_id": "Bus-1",
        "origin": "KMITL ECC, Bangkok",
        "destination": "KMITL Dormitory, Bangkok"
    },
    "Line-2": {
        "bus_id": "Bus-2",
        "origin": "KMITL Central Canteen, Bangkok",
        "destination": "KMITL Library, Bangkok"
    }
}

# เก็บ polyline ของแต่ละสาย
route_paths = {}


def fetch_route(origin, destination):
    """ดึงเส้นทางจาก Google Directions API"""
    url = (
        f"https://maps.googleapis.com/maps/api/directions/json"
        f"?origin={origin}&destination={destination}&mode=driving&key={GOOGLE_MAPS_API_KEY}"
    )
    res = requests.get(url).json()

    if res["status"] != "OK":
        return []

    points = res["routes"][0]["overview_polyline"]["points"]
    return decode_polyline(points)


def decode_polyline(polyline_str):
    """ถอดรหัส polyline (Google encoded) → list พิกัด lat,lng"""
    index, lat, lng, coords = 0, 0, 0, []
    while index < len(polyline_str):
        shift, result = 0, 0
        while True:
            b = ord(polyline_str[index]) - 63
            index += 1
            result |= (b & 0x1f) << shift
            shift += 5
            if b < 0x20:
                break
        dlat = ~(result >> 1) if result & 1 else (result >> 1)
        lat += dlat

        shift, result = 0, 0
        while True:
            b = ord(polyline_str[index]) - 63
            index += 1
            result |= (b & 0x1f) << shift
            shift += 5
            if b < 0x20:
                break
        dlng = ~(result >> 1) if result & 1 else (result >> 1)
        lng += dlng

        coords.append((lat / 1e5, lng / 1e5))
    return coords


@app.route("/")
def index():
    return render_template("index.html", api_key=GOOGLE_MAPS_API_KEY)


@app.route("/get_routes")
def get_routes():
    global route_paths
    data = []

    # ถ้า polyline ยังไม่มี → ดึงจาก Google
    if not route_paths:
        for line, info in routes.items():
            path = fetch_route(info["origin"], info["destination"])
            route_paths[line] = {"bus_id": info["bus_id"], "path": path, "index": 0}

    # อัปเดตตำแหน่ง mockup ของแต่ละสาย
    for line, info in route_paths.items():
        path = info["path"]
        idx = info["index"]

        # เดินหน้าในเส้นทาง
        idx = (idx + 1) % len(path)
        info["index"] = idx

        lat, lng = path[idx]
        data.append({
            "bus_id": info["bus_id"],
            "line": line,
            "lat": lat,
            "lng": lng,
            "path": path
        })

    return jsonify(data)


if __name__ == "__main__":
    app.run(debug=True)

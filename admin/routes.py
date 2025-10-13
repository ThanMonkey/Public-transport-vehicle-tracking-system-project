# admin/routes.py
from flask import render_template, jsonify, request, abort
from . import admin_bp
from .repo import InMemoryRepo

# ใช้ in-memory (สลับไป Firebase ได้ภายหลัง)
repo = InMemoryRepo()

# ---------- หน้า dashboard ----------
@admin_bp.get("/dashboard")
def dashboard():
    return render_template("admin-dashboard.html")

# ---------- Buses API ----------
@admin_bp.get("/api/buses")
def list_buses():
    return jsonify(repo.list_buses())

@admin_bp.post("/api/buses")
def create_bus():
    data = request.get_json() or {}
    data.setdefault("code", f"BUS-{len(repo.list_buses())+1:02d}")
    data.setdefault("status", "active")
    data.setdefault("driver", "")
    data.setdefault("plate", "")
    data.setdefault("lat", 13.7290)
    data.setdefault("lng", 100.7760)
    return jsonify(repo.create_bus(data)), 201

@admin_bp.put("/api/buses/<int:bus_id>")
def update_bus(bus_id):
    updated = repo.update_bus(bus_id, request.get_json() or {})
    if not updated: abort(404, "bus not found")
    return jsonify(updated)

@admin_bp.delete("/api/buses/<int:bus_id>")
def delete_bus(bus_id):
    if not repo.delete_bus(bus_id): abort(404, "bus not found")
    return ("", 204)

# ---------- Stops API ----------
@admin_bp.get("/api/stops")
def list_stops():
    return jsonify(repo.list_stops())

@admin_bp.post("/api/stops")
def create_stop():
    data = request.get_json() or {}
    if not {"name","lat","lng"}.issubset(data.keys()):
        abort(400, "Missing fields: name, lat, lng")
    return jsonify(repo.create_stop(data)), 201

@admin_bp.put("/api/stops/<int:stop_id>")
def update_stop(stop_id):
    updated = repo.update_stop(stop_id, request.get_json() or {})
    if not updated: abort(404, "stop not found")
    return jsonify(updated)

@admin_bp.delete("/api/stops/<int:stop_id>")
def delete_stop(stop_id):
    if not repo.delete_stop(stop_id): abort(404, "stop not found")
    return ("", 204)

# ---------- Routes API (★ ใหม่) ----------
@admin_bp.get("/api/routes")
def get_routes():
    return jsonify(repo.list_routes())

@admin_bp.post("/api/routes")
def create_route():
    data = request.get_json() or {}
    # path ควรเป็น [[lat,lng], ...]
    if not isinstance(data.get("path"), list) or len(data["path"]) < 2:
        abort(400, "path must be an array of [lat,lng] with length >= 2")
    return jsonify(repo.create_route(data)), 201

@admin_bp.put("/api/routes/<int:route_id>")
def update_route(route_id):
    updated = repo.update_route(route_id, request.get_json() or {})
    if not updated: abort(404, "route not found")
    return jsonify(updated)

@admin_bp.delete("/api/routes/<int:route_id>")
def delete_route(route_id):
    if not repo.delete_route(route_id): abort(404, "route not found")
    return ("", 204)

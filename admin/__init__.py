# admin/__init__.py
from flask import Blueprint

# ให้เสิร์ฟไฟล์ JS/CSS/PNG ของแอดมินผ่าน /admin-static/*
admin_bp = Blueprint(
    "admin",
    __name__,
    template_folder="dashboard/templates",
    static_folder="dashboard/static",
    static_url_path="/admin-static",
)
# ผูก route อื่นๆ
from . import routes  # noqa: E402,F401

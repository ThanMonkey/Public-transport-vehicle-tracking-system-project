from flask import Blueprint

# ตรงกับโครง: admin/dashboard/templates + admin/dashboard/static
admin_bp = Blueprint(
    "admin",
    __name__,
    template_folder="dashboard/templates",
    static_folder="dashboard/static",
    static_url_path="/admin-static",
)

from . import routes  # ห้ามลบ

from flask import Blueprint

from app.auth.decorators import admin_required
from app.common.errors import NotImplementedApiError
from app.common.responses import success_response

users_bp = Blueprint("users", __name__)


@users_bp.get("/health")
def users_health():
    return success_response(
        data={"module": "users"},
        message="Users module is registered",
    )


@users_bp.get("/", strict_slashes=False)
@admin_required
def list_users():
    raise NotImplementedApiError("User management logic will be implemented in the users service layer")


@users_bp.post("/", strict_slashes=False)
@admin_required
def create_user():
    raise NotImplementedApiError("User creation logic will be implemented in the users service layer")


@users_bp.patch("/<int:user_id>")
@admin_required
def update_user(user_id):
    raise NotImplementedApiError(f"User update logic for user {user_id} is not implemented yet")

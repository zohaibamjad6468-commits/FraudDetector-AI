from flask import Blueprint, request
from flask_jwt_extended import current_user as jwt_current_user
from flask_jwt_extended import get_jwt, jwt_required

from app.auth.schemas import user_to_public_dict, validate_login_payload
from app.auth.services import AuthService
from app.common.errors import ApiError
from app.common.responses import success_response

auth_bp = Blueprint("auth", __name__)


@auth_bp.get("/health")
def auth_health():
    return success_response(
        data={"module": "auth"},
        message="Auth module is registered",
    )


@auth_bp.post("/login")
def login():
    payload = validate_login_payload(request.get_json(silent=True))
    data = AuthService.login(payload["email"], payload["password"])
    return success_response(data=data, message="Login successful")


@auth_bp.post("/refresh")
@jwt_required(refresh=True)
def refresh_token():
    token = _get_bearer_token()
    data = AuthService.refresh(token, jwt_current_user)
    return success_response(data=data, message="Token refreshed")


@auth_bp.post("/logout")
@jwt_required(verify_type=False)
def logout():
    jwt_payload = get_jwt()
    body = request.get_json(silent=True) or {}
    refresh_token = None

    if jwt_payload.get("type") == "refresh":
        refresh_token = _get_bearer_token()
    else:
        refresh_token = body.get("refreshToken") or body.get("refresh_token")

    data = AuthService.logout(refresh_token)
    return success_response(data=data, message="Logout successful")


@auth_bp.get("/me")
@jwt_required()
def me():
    return success_response(
        data={"user": user_to_public_dict(jwt_current_user), "role": jwt_current_user.role},
        message="Current user loaded",
    )


def _get_bearer_token():
    header = request.headers.get("Authorization", "")
    scheme, _, token = header.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise ApiError("Bearer token is required", status_code=401, code="JWT_MISSING")
    return token.strip()

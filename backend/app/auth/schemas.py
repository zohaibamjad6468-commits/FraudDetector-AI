import re

from app.common.errors import ApiError


EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _require_json_object(payload):
    if not isinstance(payload, dict):
        raise ApiError("Request body must be a JSON object", status_code=400, code="INVALID_JSON")
    return payload


def validate_login_payload(payload):
    payload = _require_json_object(payload)
    email = str(payload.get("email", "")).strip().lower()
    password = str(payload.get("password", ""))

    errors = {}
    if not email:
        errors["email"] = "Email is required"
    elif not EMAIL_PATTERN.match(email):
        errors["email"] = "Email must be valid"

    if not password:
        errors["password"] = "Password is required"

    if errors:
        raise ApiError("Validation failed", status_code=422, errors=errors, code="VALIDATION_ERROR")

    return {"email": email, "password": password}


def user_to_public_dict(user):
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "isActive": user.is_active,
    }

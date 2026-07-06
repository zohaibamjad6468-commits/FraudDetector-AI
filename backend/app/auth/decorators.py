from functools import wraps

from flask_jwt_extended import current_user, verify_jwt_in_request

from app.common.errors import ApiError


def jwt_required_user(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        if not current_user or not current_user.is_active:
            raise ApiError("Authentication required", status_code=401, code="UNAUTHORIZED")
        return fn(*args, **kwargs)

    return wrapper


def roles_required(*roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            if not current_user or not current_user.is_active:
                raise ApiError("Authentication required", status_code=401, code="UNAUTHORIZED")

            if current_user.role not in roles:
                raise ApiError("You do not have permission to access this resource", status_code=403, code="FORBIDDEN")

            return fn(*args, **kwargs)

        return wrapper

    return decorator


def admin_required(fn):
    return roles_required("admin")(fn)


def analyst_required(fn):
    return roles_required("analyst")(fn)


def staff_required(fn):
    return roles_required("admin", "analyst")(fn)

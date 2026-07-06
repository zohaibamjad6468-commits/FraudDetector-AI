from app.common.responses import error_response
from app.users.models import User


def register_jwt_callbacks(jwt):
    @jwt.user_lookup_loader
    def load_user(jwt_header, jwt_payload):
        identity = jwt_payload.get("sub")
        if identity is None:
            return None
        return User.query.get(int(identity))

    @jwt.additional_claims_loader
    def add_user_claims(identity):
        user = User.query.get(int(identity))
        if not user:
            return {}
        return {
            "role": user.role,
            "email": user.email,
            "name": user.name,
        }

    @jwt.token_verification_loader
    def verify_user_is_active(jwt_header, jwt_payload):
        user_id = jwt_payload.get("sub")
        user = User.query.get(int(user_id)) if user_id else None
        return bool(user and user.is_active)

    @jwt.token_verification_failed_loader
    def token_verification_failed(jwt_header, jwt_payload):
        return error_response(
            message="User account is inactive or no longer exists",
            status_code=401,
            code="USER_INACTIVE",
        )

    @jwt.user_lookup_error_loader
    def user_lookup_error(jwt_header, jwt_payload):
        return error_response(
            message="Authenticated user could not be found",
            status_code=401,
            code="USER_NOT_FOUND",
        )
